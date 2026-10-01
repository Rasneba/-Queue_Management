import asyncio
import io
import os
import re
import tempfile
import urllib.parse
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import edge_tts
from amharic_numbers import build_queue_announcement, number_to_amharic, ticket_to_amharic
from amharic_normalizer import (
    STYLES,
    load_lexicon,
    normalize,
    normalize_for_speech,
    save_lexicon_entry,
)
from audio_formats import available_formats, convert, normalize_format
import account
import account_routes
from db_routes import attach_db, lifespan
from database import db

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(title="Neba Amharic TTS", lifespan=lifespan)
attach_db(app)
app.include_router(account_routes.router)

# The frontend is intentionally served by the same FastAPI process for now. This
# keeps the browser prototype useful without introducing a second build system;
# the API and speech engine remain available to a future Next.js client.
if FRONTEND_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR), name="frontend-assets")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

VOICE_MAP = {
    "en": "en-US-JennyNeural",
    "am": "am-ET-MekdesNeural",
    "om": "om-ET-MekdesNeural",
}

GENDER_VOICES: dict[str, dict[str, str]] = {
    "am": {"female": "am-ET-MekdesNeural", "male": "am-ET-AmehaNeural"},
    "om": {"female": "om-ET-MekdesNeural", "male": "en-US-BrianNeural"},
    "en": {
        "female": {
            "child": "en-US-AnaNeural",
            "teen": "en-US-JennyNeural",
            "adult": "en-US-AriaNeural",
            "senior": "en-US-MichelleNeural",
        },
        "male": {
            "child": "en-US-RogerNeural",
            "teen": "en-US-BrianNeural",
            "adult": "en-US-GuyNeural",
            "senior": "en-US-SteffanNeural",
        },
    },
}

AGE_TUNING: dict[str, dict[str, int]] = {
    "child": {"rate": 5, "pitch": 22},
    "teen": {"rate": 2, "pitch": 10},
    "adult": {"rate": 0, "pitch": 0},
    "senior": {"rate": -8, "pitch": -14},
}

GENDERS = ("female", "male")
AGES = ("child", "teen", "adult", "senior")

SPEAK_CACHE: dict[str, bytes] = {}


def _num(value: str, default: int = 0) -> int:
    match = re.search(r"[-+]?\d+", str(value or ""))
    return int(match.group()) if match else default


def pick_voice(lang: str, gender: str = "female", age: str = "adult") -> str:
    lang = lang if lang in VOICE_MAP else "am"
    gender = gender if gender in GENDERS else "female"
    age = age if age in AGES else "adult"
    by_gender = GENDER_VOICES.get(lang, GENDER_VOICES["en"])
    voice = by_gender.get(gender, by_gender["female"])
    if isinstance(voice, dict):
        voice = voice.get(age, voice["adult"])
    return voice


def compose_rate(rate: str, age: str) -> str:
    tuning = AGE_TUNING.get(age, AGE_TUNING["adult"])
    return signed(_num(rate) + tuning["rate"], "%", -80, 100)


def compose_pitch(pitch: str, age: str) -> str:
    tuning = AGE_TUNING.get(age, AGE_TUNING["adult"])
    return signed(_num(pitch) + tuning["pitch"], "Hz", -100, 100)


def signed(value: str | int, suffix: str, low: int = -100, high: int = 100) -> str:
    """edge-tts only accepts values like '+0%' / '-10Hz' (explicit sign)."""
    number = _num(value) if isinstance(value, str) else int(value)
    return f"{max(low, min(high, number)):+d}{suffix}"


def voices_for(segments, gender: str = "female", age: str = "adult", lang: str = "am") -> dict[str, str]:
    """Native voice per segment language. Unknown/"auto" request langs fall
    back to Amharic; each detected sentence language gets its own voice."""
    base = lang if lang in VOICE_MAP else "am"
    return {s.lang if s.lang in VOICE_MAP else base: pick_voice(s.lang if s.lang in VOICE_MAP else base, gender, age) for s in segments}


def voice_label(voices: dict[str, str], default_voice: str) -> str:
    distinct = sorted(set(voices.values())) if voices else [default_voice]
    return "+".join(distinct)


def describe_voice(lang: str, gender: str = "female", age: str = "adult") -> dict:
    rate = compose_rate("-10%", age)
    pitch = compose_pitch("+0Hz", age)
    return {
        "lang": lang if lang in VOICE_MAP else "am",
        "gender": gender if gender in GENDERS else "female",
        "age": age if age in AGES else "adult",
        "voice": pick_voice(lang, gender, age),
        "rate": rate,
        "pitch": pitch,
    }


class TTSRequest(BaseModel):
    text: str
    lang: str = "am"  # am | en | om | auto (per-sentence detection; English uses the English voice)
    gender: str = "female"
    age: str = "adult"
    style: str = "professional"
    rate: str = "-10%"
    pitch: str = "+0Hz"
    volume: str = "+0%"
    pause: int = 1
    adaptive: bool = True
    normalize: bool = True
    format: str = "mp3"


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "voices": list(VOICE_MAP.values()),
        "langs": ["auto"] + list(VOICE_MAP.keys()),
        "genders": list(GENDERS),
        "ages": list(AGES),
        "styles": list(STYLES.keys()),
        "formats": available_formats(),
        "lexicon_entries": len(load_lexicon()),
        "matrix": {
            lang: {g: {a: pick_voice(lang, g, a) for a in AGES} for g in GENDERS}
            for lang in VOICE_MAP
        },
    }


async def _stream_segment(text: str, voice: str, rate: str, pitch: str, volume: str) -> bytes:
    """One edge-tts request, retried on the transient failures it actually throws."""
    last_error: Exception | None = None
    for attempt in range(3):
        buffer = io.BytesIO()
        try:
            communicate = edge_tts.Communicate(
                text=text,
                voice=voice,
                rate=signed(rate, "%", -80, 100),
                pitch=signed(pitch, "Hz", -100, 100),
                volume=volume,
            )
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    buffer.write(chunk["data"])
            if buffer.tell():
                return buffer.getvalue()
            last_error = RuntimeError("no audio returned")
        except Exception as exc:  # noqa: BLE001 - upstream raises several types
            last_error = exc
        if attempt < 2:
            await asyncio.sleep(0.6 * (attempt + 1) ** 2)
    raise last_error if last_error else RuntimeError("no audio returned")


async def synth_mp3(segments, voice: str, volume: str = "+0%", voices: dict | None = None) -> tuple[bytes, list[str]]:
    """Synthesize each segment and concatenate the MP3 frames.

    A single bad segment must not fail the whole request: fragments the engine
    cannot pronounce are skipped and reported as warnings instead.

    Each segment is spoken with its native voice (Amharic vs English/Oromo)
    via the optional lang -> voice map, so English sentences never get an
    Amharic accent. Segments without a mapped language use the default voice.
    """
    volume = signed(volume, "%", -100, 100)
    chunks: list[bytes] = []
    warnings: list[str] = []
    pending_pause = 0

    for segment in segments:
        text = segment.text
        if pending_pause:
            text = "\u1362" * pending_pause + " " + text
        pending_pause = segment.pause_after
        seg_voice = voices.get(segment.lang, voice) if voices else voice

        try:
            chunks.append(await _stream_segment(text, seg_voice, segment.rate, segment.pitch, volume))
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"segment skipped ({type(exc).__name__}): {text[:60]}")

    if not chunks:
        detail = "No speakable content found in the request."
        if warnings:
            detail = f"{detail} {warnings[0]}"
        raise HTTPException(status_code=400, detail=detail)
    return b"".join(chunks), warnings


def prepare(text: str, req: TTSRequest):
    tuning = AGE_TUNING.get(req.age, AGE_TUNING["adult"])
    return normalize_for_speech(
        text,
        lang=req.lang,
        style=req.style,
        pause=max(0, min(3, req.pause)),
        rate=req.rate,
        pitch=req.pitch,
        adaptive=req.adaptive,
        normalize_text=req.normalize,
        age_rate_delta=tuning["rate"],
        age_pitch_delta=tuning["pitch"],
    )


async def record_usage(request: Request, req, voice, prepared, fmt, data, warnings) -> None:
    """Charge credits and log history for identified callers only.

    Anonymous callers are not billed and not written to the database, so a public
    endpoint cannot be used to flood it with rows.
    """
    if not db.configured:
        return
    try:
        user = await account_routes.current_user(
            request.headers.get("authorization"),
            request.headers.get("x-api-key"),
        )
        if not user:
            return
        characters = len(req.text or "")
        cost, _balance = await account.charge(user["id"], characters)
        await account.record_request(
            user["id"],
            request_id=request.headers.get("x-request-id"),
            input_text=req.text,
            spoken_text=" ".join(s.text for s in prepared.segments),
            voice=voice,
            gender=req.gender,
            age=req.age,
            style=req.style,
            audio_format=fmt,
            characters=characters,
            credits=cost,
            audio_bytes=len(data),
            duration_ms=None,
            warnings=warnings,
        )
    except ValueError:
        # Raised by account.charge for an insufficient balance. Must reach the
        # caller so it can answer 402 instead of serving unpaid audio.
        raise
    except Exception:
        # Any other database problem is best-effort: do not fail the audio.
        return


def audio_response(data: bytes, media_type: str, ext: str, filename: str, cache_key: str):
    if len(SPEAK_CACHE) < 200:
        SPEAK_CACHE[cache_key] = data
    return Response(
        content=data,
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}.{ext}"',
            "Cache-Control": "public, max-age=600",
        },
    )


@app.post("/speak")
async def speak(req: TTSRequest, request: Request):
    fmt = normalize_format(req.format)
    cache_key = (
        f"s:{req.lang}:{req.gender}:{req.age}:{req.style}:{req.rate}:{req.pitch}:"
        f"{req.volume}:{req.pause}:{int(req.adaptive)}:{int(req.normalize)}:{fmt}:{req.text}"
    )
    if cache_key in SPEAK_CACHE:
        data, ext = SPEAK_CACHE[cache_key], fmt
        media = {"mp3": "audio/mpeg", "wav": "audio/wav", "flac": "audio/flac"}[ext]
        # A cache hit still costs credits and must still appear in history,
        # otherwise repeat requests are free and leave no audit trail.
        prepared = prepare(req.text, req)
        try:
            voice = pick_voice(req.lang, req.gender, req.age)
            voices = voices_for(prepared.segments, req.gender, req.age, req.lang)
            await record_usage(request, req, voice_label(voices, voice), prepared, fmt, data, None)
        except ValueError as e:
            raise HTTPException(status_code=402, detail=str(e))
        return audio_response(data, media, ext, "tts", cache_key)

    try:
        voice = pick_voice(req.lang, req.gender, req.age)
        prepared = prepare(req.text, req)
        voices = voices_for(prepared.segments, req.gender, req.age, req.lang)
        mp3, warnings = await synth_mp3(prepared.segments, voice, req.volume, voices)
        data, media_type, ext = convert(mp3, fmt)
        response = audio_response(data, media_type, ext, "tts", cache_key)
        if warnings:
            response.headers["X-TTS-Warnings"] = urllib.parse.quote("; ".join(warnings))
        await record_usage(request, req, voice_label(voices, voice), prepared, fmt, data, warnings)
        return response
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=402, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class NormalizeRequest(BaseModel):
    text: str
    lang: str = "am"
    style: str = "professional"
    age: str = "adult"
    rate: str = "-10%"
    pitch: str = "+0Hz"
    pause: int = 1
    adaptive: bool = True
    normalize: bool = True


@app.post("/normalize")
async def normalize_endpoint(req: NormalizeRequest):
    """Show exactly what the engine will be asked to say."""
    tuning = AGE_TUNING.get(req.age, AGE_TUNING["adult"])
    result = normalize_for_speech(
        req.text,
        lang=req.lang,
        style=req.style,
        pause=max(0, min(3, req.pause)),
        rate=req.rate,
        pitch=req.pitch,
        adaptive=req.adaptive,
        normalize_text=req.normalize,
        age_rate_delta=tuning["rate"],
        age_pitch_delta=tuning["pitch"],
    )
    return {
        "original": req.text,
        **result.as_dict(),
        "voice": pick_voice(req.lang, req.gender if hasattr(req, "gender") else "female", req.age),
        "voices": voices_for(result.segments, req.gender if hasattr(req, "gender") else "female", req.age, req.lang),
    }


_STT_MODEL = None
_STT_MODEL_NAME = ""


def stt_engine():
    """Lazily load faster-whisper (optional dependency).

    Raises 503 when it is not installed, so the ASR Studio can fall back
    to browser dictation with a clear message instead of a dead button.
    """
    global _STT_MODEL, _STT_MODEL_NAME
    name = os.getenv("STT_MODEL", "small")
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail="Transcription engine is not installed. Run: pip install faster-whisper",
        ) from exc
    if _STT_MODEL is None or _STT_MODEL_NAME != name:
        _STT_MODEL = WhisperModel(
            name,
            device=os.getenv("STT_DEVICE", "auto"),
            compute_type=os.getenv("STT_COMPUTE", "default"),
        )
        _STT_MODEL_NAME = name
    return _STT_MODEL


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), language: str = Form("am-ET")):
    """Speech-to-text for the ASR Studio: audio upload -> transcript."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty audio file")
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file too large (max 25 MB)")

    model = stt_engine()
    lang = {"am-ET": "am", "en-US": "en"}.get((language or "").strip(), "am")
    suffix = Path(file.filename or "audio.webm").suffix or ".webm"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        tmp.write(data)
        tmp.close()

        def _run():
            raw_segments, info = model.transcribe(tmp.name, language=lang, beam_size=5)
            items = [{"start": s.start, "end": s.end, "text": s.text.strip()} for s in raw_segments]
            return items, info.language, info.duration

        items, detected, duration = await asyncio.to_thread(_run)
        return {
            "text": " ".join(s["text"] for s in items).strip(),
            "language": detected,
            "duration": duration,
            "engine": f"faster-whisper:{os.getenv('STT_MODEL', 'small')}",
            "segments": items,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


class LexiconRequest(BaseModel):
    word: str
    say: str
    alt: str | None = None


@app.get("/lexicon")
async def get_lexicon():
    return {"entries": load_lexicon()}


@app.post("/lexicon")
async def add_lexicon(req: LexiconRequest):
    if not req.word.strip() or not req.say.strip():
        raise HTTPException(status_code=400, detail="word and say are required")
    entries = save_lexicon_entry(req.word, req.say, req.alt)
    return {"status": "ok", "count": len(entries), "word": req.word, "say": req.say}


class QueueRequest(BaseModel):
    ticket: str
    counter: str
    lang: str = "am"
    gender: str = "female"
    age: str = "adult"
    style: str = "professional"
    department: str | None = None
    rate: str = "-10%"
    pitch: str = "+0Hz"
    volume: str = "+0%"
    pause: int = 1
    adaptive: bool = True
    normalize: bool = True
    format: str = "mp3"


@app.post("/queue-speak")
async def queue_speak(req: QueueRequest):
    text = build_queue_announcement(req.ticket, req.counter, req.lang, req.department)
    fmt = normalize_format(req.format)
    cache_key = (
        f"q:{req.lang}:{req.gender}:{req.age}:{req.style}:{req.rate}:{req.pitch}:{req.volume}:"
        f"{req.pause}:{int(req.adaptive)}:{int(req.normalize)}:{fmt}:{req.ticket}:{req.counter}:{req.department}"
    )
    if cache_key in SPEAK_CACHE:
        media = {"mp3": "audio/mpeg", "wav": "audio/wav", "flac": "audio/flac"}[fmt]
        return audio_response(SPEAK_CACHE[cache_key], media, fmt, "queue", cache_key)

    try:
        voice = pick_voice(req.lang, req.gender, req.age)
        prepared = prepare(text, req)
        voices = voices_for(prepared.segments, req.gender, req.age, req.lang)
        mp3, warnings = await synth_mp3(prepared.segments, voice, req.volume, voices)
        data, media_type, ext = convert(mp3, fmt)
        response = audio_response(data, media_type, ext, "queue", cache_key)
        if warnings:
            response.headers["X-TTS-Warnings"] = urllib.parse.quote("; ".join(warnings))
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PrintTicketRequest(BaseModel):
    id: str
    name: str
    department: str
    service: str
    checkInTime: str
    estimatedWaitMinutes: int
    qrDataUrl: str | None = None


@app.post("/print-ticket")
async def print_ticket(req: PrintTicketRequest):
    import base64, io, textwrap
    from PIL import Image, ImageDraw, ImageFont

    try:
        import win32print
    except ImportError:
        raise HTTPException(status_code=503, detail="pywin32 is required for printing")

    W, H = 384, 900
    BOLD, REG = None, None
    try:
        BOLD = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 28)
    except:
        BOLD = ImageFont.load_default()
    try:
        REG = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 20)
    except:
        REG = ImageFont.load_default()

    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    y = 20
    BLACK, GRAY = "#000000", "#555555"

    def center(text, font, color=BLACK):
        nonlocal y
        bbox = d.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        d.text(((W - tw) // 2, y), text, fill=color, font=font)
        y += bbox[3] - bbox[1] + 4

    def line(text, font, color=BLACK):
        nonlocal y
        d.text((20, y), text, fill=color, font=font)
        bbox = d.textbbox((0, 0), text, font=font)
        y += bbox[3] - bbox[1] + 4

    center("LANCET GENERAL HOSPITAL", BOLD)
    center("\u2605 \u2605 \u2605 TICKET \u2605 \u2605 \u2605", REG, GRAY)
    y += 8
    d.line([(20, y), (W - 20, y)], fill="black", width=2)
    y += 12

    center(f"Ticket #{req.id}", BOLD)
    y += 4
    d.line([(20, y), (W - 20, y)], fill="black", width=1)
    y += 12

    line(f"Patient:  {req.name}", REG)
    line(f"Dept:     {req.department}", REG)
    line(f"Service:  {req.service}", REG)
    y += 4
    d.line([(20, y), (W - 20, y)], fill="black", width=1)
    y += 12

    line(f"Check-in: {req.checkInTime}", REG)
    line(f"Est wait: {req.estimatedWaitMinutes} min", BOLD)
    y += 4
    d.line([(20, y), (W - 20, y)], fill="black", width=1)
    y += 12

    barcode_text = f"  * {req.id} *  "
    bw = d.textbbox((0, 0), barcode_text, font=BOLD)
    d.text(((W - (bw[2] - bw[0])) // 2, y), barcode_text, fill=BLACK, font=BOLD)
    y += bw[3] - bw[1] + 16

    center("Please keep this ticket with you.", REG, GRAY)
    y += 12

    if req.qrDataUrl:
        try:
            _, b64 = req.qrDataUrl.split(",", 1)
            qr_bytes = base64.b64decode(b64)
            qr = Image.open(io.BytesIO(qr_bytes)).convert("RGB")
            qr = qr.resize((150, 150))
            qx = (W - 150) // 2
            qy = y
            img.paste(qr, (qx, qy))
            y += 160
        except:
            pass

    out = io.BytesIO()
    cropped = img.crop((0, 0, W, min(y + 40, H)))
    cropped.save(out, format="BMP")
    out.seek(0)
    bmp_bytes = out.read()

    try:
        printer_name = win32print.GetDefaultPrinter()
        hprinter = win32print.OpenPrinter(printer_name)
        try:
            win32print.StartDocPrinter(hprinter, 1, ("ticket", None, "RAW"))
            win32print.StartPagePrinter(hprinter)
            win32print.WritePrinter(hprinter, bmp_bytes)
            win32print.EndPagePrinter(hprinter)
            win32print.EndDocPrinter(hprinter)
        finally:
            win32print.ClosePrinter(hprinter)
        return {"status": "ok", "printer": printer_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/test")
async def test_page():
    return HTMLResponse(content=TEST_HTML)


TEST_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lancet TTS Test</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;padding:20px}
  .card{background:#1e293b;border-radius:16px;padding:20px;margin-bottom:12px;border:1px solid #334155}
  h1{font-size:18px;margin-bottom:4px;color:#60a5fa}
  h2{font-size:12px;margin-bottom:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px}
  input,textarea{width:100%;padding:10px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#e2e8f0;font-size:15px;font-family:inherit}
  input:focus,textarea:focus{outline:none;border-color:#60a5fa}
  .row{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
  button{padding:8px 16px;border-radius:8px;border:none;font-weight:700;font-size:13px;cursor:pointer;transition:all .15s}
  button:active{transform:scale(.97)}
  .btn-speak{background:#3b82f6;color:#fff;flex:1}
  .btn-speak:hover{background:#2563eb}
  .btn-stop{background:#ef4444;color:#fff}
  .btn-download{background:#059669;color:#fff}
  .btn-download:hover:not(:disabled){background:#047857}
  .btn-download:disabled{background:#334155;color:#64748b;cursor:not-allowed}
  .btn-preset{background:#1e3a5f;color:#93c5fd;border:1px solid #1e40af;font-size:11px;padding:6px 12px}
  .lang-btn{background:#334155;color:#94a3b8}
  .lang-btn.active{background:#3b82f6;color:#fff}
  .opt-row{display:flex;gap:6px;flex-wrap:wrap}
  .opt-btn{background:#334155;color:#94a3b8;border:1px solid #475569;padding:8px 14px}
  .opt-btn.active{background:#8b5cf6;color:#fff;border-color:#7c3aed}
  .opt-label{color:#64748b;font-size:10px;margin:12px 0 5px;text-transform:uppercase;letter-spacing:1px}
  .opt-label:first-child{margin-top:0}
  .slider-row{display:flex;align-items:center;gap:10px;margin-top:8px}
  .slider-row label{color:#94a3b8;font-size:12px;width:52px;flex:0 0 auto}
  .slider-row input[type=range]{flex:1;padding:0;accent-color:#8b5cf6;height:20px}
  .slider-row .val{color:#c4b5fd;font-size:12px;font-weight:700;width:58px;text-align:right;flex:0 0 auto}
  .voice-read{margin-top:12px;padding:9px;border-radius:6px;background:#0f172a;color:#86efac;font-size:12px;font-family:monospace;word-break:break-all}
  .norm-out{margin-top:10px;padding:10px;border-radius:6px;background:#0f172a;color:#e2e8f0;font-size:13px;line-height:1.6;min-height:40px}
  .norm-notes{margin-top:8px;color:#94a3b8;font-size:11px;line-height:1.7;font-family:monospace;word-break:break-word}
  .status{margin-top:8px;padding:8px;border-radius:6px;font-size:12px;display:none}
  .status.playing{display:block;background:#14532d;color:#86efac}
  .status.loading{display:block;background:#713f12;color:#fde68a}
  .status.error{display:block;background:#7f1d1d;color:#fca5a5}
  .number-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:4px;margin-top:10px}
  .num-btn{background:#0f172a;color:#cbd5e1;border:1px solid #334155;padding:8px 4px;font-size:11px;text-align:center;border-radius:6px;cursor:pointer}
  .num-btn:hover{background:#1e40af;color:#fff;border-color:#3b82f6}
  .num-btn .am{font-size:14px;display:block;margin-bottom:1px}
  .num-btn .latin{font-size:9px;color:#64748b}
  .queue-row{display:flex;gap:6px;align-items:center;padding:8px;border-radius:8px;background:#0f172a;margin-bottom:4px}
  .queue-row .ticket{font-family:monospace;font-weight:700;color:#facc15;min-width:90px;font-size:13px}
  .queue-row .room{color:#34d399;font-size:12px;flex:1}
  .q-row{display:flex;gap:6px;align-items:center}
  .q-row input{flex:1}
  .q-row .btn-speak{flex:0 0 auto}
</style>
</head>
<body>

<div class="card">
  <h1>Lancet TTS Test Panel</h1>
  <div style="color:#64748b;font-size:11px;margin-top:2px">edge-tts female voices &bull; am-ET-MekdesNeural &bull; localhost:8765</div>
</div>

<div class="card">
  <h2>Language</h2>
  <div class="row">
    <button class="lang-btn active" onclick="setLang('auto',this)">Auto</button>
    <button class="lang-btn" onclick="setLang('am',this)">አማርኛ</button>
    <button class="lang-btn" onclick="setLang('om',this)">Afaan Oromoo</button>
    <button class="lang-btn" onclick="setLang('en',this)">English</button>
  </div>
</div>

<div class="card">
  <h2>Voice (gender + age)</h2>
  <div class="opt-label">Gender</div>
  <div class="opt-row" id="genderRow"></div>
  <div class="opt-label">Age</div>
  <div class="opt-row" id="ageRow"></div>
  <div class="opt-label">Speed &amp; Pitch</div>
  <div class="slider-row"><label>Rate</label><input type="range" id="rateSlider" min="-50" max="50" step="5" value="-10" oninput="onSlider()"><span class="val" id="rateVal">-10%</span></div>
  <div class="slider-row"><label>Pitch</label><input type="range" id="pitchSlider" min="-50" max="50" step="2" value="0" oninput="onSlider()"><span class="val" id="pitchVal">+0Hz</span></div>
  <div class="slider-row"><label>Volume</label><input type="range" id="volSlider" min="0" max="100" step="5" value="100" oninput="onVol()"><span class="val" id="volVal">100%</span></div>
  <div class="voice-read" id="voiceRead">loading voices...</div>
  <div class="row">
    <button class="btn-preset" style="flex:1" onclick="previewVoice()">Preview Voice</button>
    <button class="btn-preset" style="flex:1" onclick="resetVoice()">Reset</button>
  </div>
</div>

<div class="card">
  <h2>Speaking style &amp; pauses</h2>
  <div class="opt-label">Style</div>
  <div class="opt-row" id="styleRow"></div>
  <div class="slider-row"><label>Pause</label><input type="range" id="pauseSlider" min="0" max="3" step="1" value="1" oninput="onPause()"><span class="val" id="pauseVal">normal</span></div>
  <div class="opt-label">Download format</div>
  <div class="opt-row" id="formatRow"></div>
</div>

<div class="card">
  <h2>Text normalization preview</h2>
  <div style="color:#64748b;font-size:10px">Numbers, dates, currency, acronyms, symbols and lexicon fixes before speaking</div>
  <div class="row">
    <button class="btn-preset" style="flex:1" onclick="showNormalized()">Preview</button>
    <button class="btn-preset" style="flex:1" onclick="speakNormalized()">Speak Normalized</button>
  </div>
  <div class="norm-out" id="normOut">-</div>
  <div class="norm-notes" id="normNotes"></div>
</div>

<div class="card">
  <h2>Custom vocabulary (pronunciation dictionary)</h2>
  <div class="row">
    <input id="lexWord" placeholder="word" style="flex:1">
    <input id="lexSay" placeholder="say it like" style="flex:1">
    <button class="btn-download" style="flex:0 0 auto;padding:8px 16px" onclick="addLexicon()">Add</button>
  </div>
  <div class="norm-notes" id="lexStatus"></div>
</div>

<div class="card">
  <h2>Type and Speak (free text)</h2>
  <textarea id="textInput" rows="2" placeholder="Type any Amharic/English text...">እንግዳ ቁጥር አርባ ሁለት ወደ መቀበያ ቁጥር ሶስት ይምጡ</textarea>
  <div class="row">
    <button class="btn-speak" onclick="speakFree()">Speak</button>
    <button class="btn-preset" onclick="showNormalized()">Preview Text</button>
  </div>
</div>

<div class="card">
  <h2>Generated audio player</h2>
  <div class="norm-out" id="fileName" style="color:#94a3b8">no audio yet</div>
  <audio id="player" controls preload="none" style="width:100%;margin-top:10px"></audio>
  <div class="row">
    <button class="btn-speak" style="flex:1" onclick="playLast()">Play</button>
    <button class="btn-stop" onclick="stopAudio()">Stop</button>
    <button class="btn-download" id="downloadBtn" onclick="downloadAudio()" disabled>Download</button>
  </div>
  <div id="status" class="status"></div>
</div>

<div class="card">
  <h2>Queue Announcer (ticket + counter)</h2>
  <div class="row" style="margin-bottom:8px">
    <input id="ticketInput" placeholder="Ticket (e.g. P-1)" value="P-1" style="flex:1">
    <input id="counterInput" placeholder="Counter" value="3" style="width:80px">
    <button class="btn-speak" style="flex:0 0 auto;padding:8px 20px" onclick="speakQueue()">Announce</button>
    <button class="btn-preset" style="flex:0 0 auto;padding:8px 20px" onclick="saveQueueFromInputs()">Save</button>
  </div>
  <div style="color:#64748b;font-size:10px">Python converts numbers to Amharic, then edge-tts speaks it</div>
</div>

<div class="card">
  <h2>Quick Queue Demos</h2>
  <div id="queueDemo"></div>
</div>

<div class="card">
  <h2>Amharic Numbers (click to hear)</h2>
  <div class="number-grid" id="numGrid"></div>
</div>

<script>
let currentLang='auto',currentGender='female',currentAge='adult',currentStyle='professional',currentFormat='mp3',volume=100,VOICES={};
const GENDER_OPTS=[['female','Female'],['male','Male']];
const AGE_OPTS=[['child','Child'],['teen','Teen'],['adult','Adult'],['senior','Senior']];
const STYLE_OPTS=[['professional','Professional'],['friendly','Friendly'],['happy','Happy'],['serious','Serious'],['calm','Calm'],['excited','Excited']];
const FORMAT_OPTS=[['mp3','MP3'],['wav','WAV'],['flac','FLAC']];
const AMHARIC={1:'አንድ',2:'ሁለት',3:'ሦስት',4:'አራት',5:'አምስት',6:'ስድስት',7:'ሰባት',8:'ስምንት',9:'ዘጠኙ',10:'አስር',20:'ሀያ',30:'ሰላሳ',40:'አርባ',50:'ሀምሳ',60:'ስድሳ',70:'ሰባ',80:'ሰማንያ',90:'ዘጠና',100:'መቶ',11:'አስራ አንድ',12:'አስራ ሁለት',13:'አስራ ሦስት',14:'አስራ አራት',15:'አስራ አምስት',16:'አስራ ስድስት',17:'አስራ ሰባት',18:'አስራ ስምንት',19:'አስራ ዘጠኙ',21:'ሀያ አንድ',22:'ሀያ ሁለት',23:'ሀያ ሦስት',24:'ሀያ አራት',25:'ሀያ አምስት',31:'ሰላሳ አንድ',32:'ሰላሳ ሁለት',33:'ሰላሳ ሦስት',41:'አርባ አንድ',42:'አርባ ሁለት',43:'አርባ ሦስት',51:'ሀምሳ አንድ',52:'ሀምሳ ሁለት',55:'ሀምሳ አምስት',61:'ስድሳ አንድ',63:'ስድሳ ሶስት',71:'ሰባ አንድ',73:'ሰባ ሦስት',81:'ሰማንያ አንድ',85:'ሰማንያ አምስት',91:'ዘጠና አንድ',99:'ዘጠና ዘጠኝ'};

function amharicNum(n){if(AMHARIC[n])return AMHARIC[n];if(n<10)return AMHARIC[n]||String(n);const t=Math.floor(n/10)*10,o=n%10;if(o===0)return AMHARIC[t]||String(n);return(AMHARIC[t]||'')+' '+(AMHARIC[o]||String(o))}

function buildNumberGrid(){const g=document.getElementById('numGrid');const ns=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,30,40,42,43,45,50,52,55,60,63,65,70,73,75,80,85,90,99,100];g.innerHTML=ns.map(n=>'<button class="num-btn" onclick="speakNumber('+n+')"><span class="am">'+amharicNum(n)+'</span><span class="latin">'+n+'</span></button>').join('')}

function buildQueueDemo(){const d=document.getElementById('queueDemo');const ts=[{t:'P-1',c:'Room 2'},{t:'P-2',c:'Room 4'},{t:'P-3',c:'Trauma 1'},{t:'P-4',c:'Room 3'},{t:'P-5',c:'Room 5'},{t:'P-42',c:'Room 1'},{t:'P-100',c:'Reception 1'}];d.innerHTML=ts.map(x=>'<div class="queue-row"><span class="ticket">'+x.t+'</span><span class="room">Counter: '+x.c+'</span><button class="btn-preset" onclick="quickQueue(\\''+x.t+'\\',\\''+x.c+'\\')">Play</button><button class="btn-preset" onclick="saveQueue(&#39;'+x.t+'&#39;,&#39;'+x.c+'&#39;)">Save</button></div>').join('')}

function setLang(lang,btn){currentLang=lang;document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');updateVoiceRead()}

function buildOptRow(id,items){const r=document.getElementById(id);r.innerHTML=items.map(x=>'<button class="opt-btn" data-v="'+x[0]+'" onclick="pickOpt(this)">'+x[1]+'</button>').join('')}

function pickOpt(btn){const v=btn.dataset.v;const id=btn.parentElement.id;if(id==='genderRow'){currentGender=v}else if(id==='ageRow'){currentAge=v}else if(id==='styleRow'){currentStyle=v}else if(id==='formatRow'){currentFormat=v}syncOpts();updateVoiceRead()}

function syncOpts(){[['#genderRow',currentGender],['#ageRow',currentAge],['#styleRow',currentStyle],['#formatRow',currentFormat]].forEach(p=>{document.querySelectorAll(p[0]+' .opt-btn').forEach(b=>b.classList.toggle('active',b.dataset.v===p[1]))})}

function sgn(n){n=Math.round(n);return(n>=0?'+':'')+n}
function rateVal(){return sgn(document.getElementById('rateSlider').valueAsNumber)+'%'}
function pitchVal(){return sgn(document.getElementById('pitchSlider').valueAsNumber)+'Hz'}
function volumeVal(){return sgn(Math.round((document.getElementById('volSlider').valueAsNumber-100)/5)*5)+'%'}
function pauseVal(){return Math.max(0,Math.min(3,document.getElementById('pauseSlider').valueAsNumber))}
const PAUSE_LABEL={0:'none',1:'normal',2:'long',3:'very long'}

function onSlider(){document.getElementById('rateVal').textContent=rateVal();document.getElementById('pitchVal').textContent=pitchVal();updateVoiceRead()}

function onVol(){volume=document.getElementById('volSlider').valueAsNumber;document.getElementById('volVal').textContent=Math.round(volume)+'%';updateVoiceRead()}

function onPause(){document.getElementById('pauseVal').textContent=PAUSE_LABEL[pauseVal()];updateVoiceRead()}

function voicePayload(extra){return Object.assign({lang:currentLang,gender:currentGender,age:currentAge,style:currentStyle,rate:rateVal(),pitch:pitchVal(),volume:volumeVal(),pause:pauseVal(),format:currentFormat},extra||{})}

function updateVoiceRead(){const e=document.getElementById('voiceRead');if(!e)return;const lang=currentLang==='auto'?'am':currentLang;const g=(VOICES[lang]||{})[currentGender]||{};const autoNote=currentLang==='auto'?'  |  auto: English sentences use the English voice':'';e.textContent=(g[currentAge]||'...')+'  |  '+currentGender+'  |  '+currentAge+'  |  '+currentStyle+'  |  rate '+rateVal()+'  |  pitch '+pitchVal()+'  |  vol '+volumeVal()+'  |  pause '+PAUSE_LABEL[pauseVal()]+'  |  '+currentFormat.toUpperCase()+autoNote}

async function loadVoices(){try{const r=await fetch('/health');VOICES=(await r.json()).matrix||{}}catch(e){VOICES={}}updateVoiceRead()}

function resetVoice(){currentGender='female';currentAge='adult';currentStyle='professional';currentFormat='mp3';document.getElementById('rateSlider').value=-10;document.getElementById('pitchSlider').value=0;document.getElementById('volSlider').value=100;document.getElementById('pauseSlider').value=1;syncOpts();onSlider();onVol();onPause()}

function previewVoice(){const t=document.getElementById('textInput');if(!t.value.trim())t.value=currentLang==='en'?'Queue announcement test.':'የተማሪነት ድምፅ ሙከራ ነው።';speakFree()}

async function showNormalized(){const t=document.getElementById('textInput').value.trim();if(!t)return;showStatus('loading','Normalizing...');try{const r=await fetch('/normalize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:t,lang:currentLang,age:currentAge,style:currentStyle,rate:rateVal(),pitch:pitchVal(),pause:pauseVal()})});const j=await r.json();document.getElementById('normOut').textContent=j.text;document.getElementById('normNotes').innerHTML=(j.notes||[]).map(n=>'&bull; '+n).join('<br>')||'no changes';showStatus('','')}catch(e){showStatus('error','Error: '+e.message)}}

async function speakNormalized(){const t=document.getElementById('textInput').value.trim();if(!t)return;await showNormalized();const spoken=document.getElementById('normOut').textContent;if(!spoken)return;showStatus('loading','Generating...');try{const b=await genAudio('/speak',voicePayload({text:spoken,normalize:false}));setDownload(b,'tts-'+currentLang+'-'+Date.now()+'.'+currentFormat);playLast()}catch(e){showStatus('error','Error: '+e.message)}}

async function addLexicon(){const w=document.getElementById('lexWord').value.trim(),s=document.getElementById('lexSay').value.trim();const box=document.getElementById('lexStatus');if(!w||!s){box.textContent='enter a word and how it should be said';return}try{const r=await fetch('/lexicon',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word:w,say:s})});const j=await r.json();box.textContent=j.status==='ok'?('saved: '+j.word+' -> '+j.say+' ('+j.count+' entries)'):('error: '+JSON.stringify(j));document.getElementById('lexWord').value='';document.getElementById('lexSay').value=''}catch(e){box.textContent='Error: '+e.message}}

let lastBlob=null,lastName='',lastUrl='';
function showStatus(c,m){const e=document.getElementById('status');e.className='status '+c;e.textContent=m}

async function genAudio(path,payload){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok){let d=r.statusText;try{const j=await r.json();d=j.detail||JSON.stringify(j)}catch(e){}throw new Error('HTTP '+r.status+' '+d)}const b=await r.blob();if(b.size<100)throw new Error('empty audio');return b}

function setDownload(blob,name){if(lastUrl)URL.revokeObjectURL(lastUrl);lastBlob=blob;lastName=name;lastUrl=blob?URL.createObjectURL(blob):'';const b=document.getElementById('downloadBtn');if(b){b.disabled=!blob;b.title=blob?('Save as '+name):'Generate audio first'}const f=document.getElementById('fileName');if(f){f.textContent=blob?(name+'  ('+Math.round(blob.size/1024)+' KB)'):'no audio yet';f.style.color=blob?'#86efac':'#94a3b8'}const p=document.getElementById('player');if(p&&blob)p.src=lastUrl}

function downloadAudio(){if(!lastBlob)return;const u=URL.createObjectURL(lastBlob);const a=document.createElement('a');a.href=u;a.download=lastName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);showStatus('playing','Saved '+lastName)}

function playLast(){if(!lastUrl){showStatus('error','Generate audio first');return}const p=document.getElementById('player');p.src=lastUrl;p.play().catch(()=>showStatus('error','Playback error'))}
function stopAudio(){const p=document.getElementById('player');if(p){p.pause();p.currentTime=0}showStatus('','')}

function qFile(t,c){const s=v=>String(v).replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'');return 'queue-'+s(t)+'-'+s(c)+'-'+currentLang+'-'+currentGender+'-'+currentAge+'.'+currentFormat}

async function speakFree(){const t=document.getElementById('textInput').value.trim();if(!t)return;showStatus('loading','Generating...');try{const b=await genAudio('/speak',voicePayload({text:t}));setDownload(b,'tts-'+currentLang+'-'+currentGender+'-'+currentAge+'.'+currentFormat);playLast()}catch(e){showStatus('error','Error: '+e.message)}}

async function speakQueue(){const t=document.getElementById('ticketInput').value.trim();const c=document.getElementById('counterInput').value.trim();if(!t||!c)return;showStatus('loading','Generating queue announcement...');try{const b=await genAudio('/queue-speak',voicePayload({ticket:t,counter:c}));setDownload(b,qFile(t,c));playLast()}catch(e){showStatus('error','Error: '+e.message)}}

async function saveQueue(t,c){showStatus('loading','Generating queue announcement...');try{const b=await genAudio('/queue-speak',voicePayload({ticket:t,counter:c}));setDownload(b,qFile(t,c));downloadAudio()}catch(e){showStatus('error','Error: '+e.message)}}

function quickQueue(t,c){document.getElementById('ticketInput').value=t;document.getElementById('counterInput').value=c;speakQueue()}

function saveQueueFromInputs(){const t=document.getElementById('ticketInput').value.trim(),c=document.getElementById('counterInput').value.trim();if(!t||!c){showStatus('error','Enter ticket and counter');return}saveQueue(t,c)}

function speakNumber(n){document.getElementById('textInput').value=amharicNum(n);speakFree()}

buildOptRow('genderRow',GENDER_OPTS);buildOptRow('ageRow',AGE_OPTS);
buildOptRow('styleRow',STYLE_OPTS);buildOptRow('formatRow',FORMAT_OPTS);
syncOpts();onSlider();onVol();onPause();loadVoices();
buildNumberGrid();buildQueueDemo();
</script>
</body>
</html>"""


@app.get("/", response_class=HTMLResponse)
async def frontend_home():
    """Serve the product frontend from the same origin as the TTS API."""
    if not FRONTEND_DIR.is_dir():
        raise HTTPException(status_code=404, detail="Frontend is not installed")
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/{frontend_path:path}", response_class=HTMLResponse)
async def frontend_routes(frontend_path: str):
    """Let the client-side router handle public and dashboard URLs."""
    if not FRONTEND_DIR.is_dir():
        raise HTTPException(status_code=404, detail="Frontend is not installed")
    return FileResponse(FRONTEND_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn

    # Render, Railway, Fly and similar platforms inject PORT and expect a public
    # bind. Locally we stay on loopback unless TTS_HOST is set explicitly.
    port = int(os.getenv("PORT") or os.getenv("TTS_PORT") or 8765)
    host = os.getenv("TTS_HOST") or ("0.0.0.0" if os.getenv("PORT") else "127.0.0.1")
    print(f"Starting edge-tts server on http://{host}:{port}")
    print(f"Test page: http://{host}:{port}/test")
    if host == "0.0.0.0":
        print("WARNING: bound to all interfaces. There is no authentication and CORS is open,")
        print("         so only run this way when the platform terminates TLS for you.")
    uvicorn.run(app, host=host, port=port)
