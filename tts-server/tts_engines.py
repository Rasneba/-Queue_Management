"""
Pluggable TTS synthesis backends.

The normalizer (`amharic_normalizer`) stays the permanent front-end; only the
synthesis step is swappable, so an offline model can replace edge-tts without
touching /speak, /queue-speak or the frontend.

Engines
-------
edge      Microsoft Edge neural voices over the network. Default. Commercial
          use allowed, no local compute, not offline.
mms_onnx  facebook/mms-tts-amh (VITS) via ONNX Runtime. Runs offline on CPU.

          LICENSE WARNING: mms-tts-amh is CC-BY-NC 4.0, i.e. NON-COMMERCIAL.
          It is fine for demos, evaluation and blinded A/B benchmarking, but
          it must NOT be used to serve paying customers. The commercial path
          is an own VITS fine-tuned on licensed Amharic audio (see
          OPEN_TTS_DATASHEET.md, Phase 2). `license_ok_for_commercial()` is
          False for this engine and /health reports it.

Selection is by env var TTS_ENGINE (edge | mms_onnx | auto).
"""

from __future__ import annotations

import io
import os

ENGINE_EDGE = "edge"
ENGINE_MMS_ONNX = "mms_onnx"
# Backwards-compatible short alias.
ENGINE_MMS = ENGINE_MMS_ONNX

# WAV written by the offline engines, decoded by audio_formats for mp3 output.
OFFLINE_SAMPLE_RATE = 16000


def active_engine() -> str:
    """The engine to use for synthesis."""
    requested = (os.getenv("TTS_ENGINE") or ENGINE_EDGE).strip().lower()
    if requested in (ENGINE_EDGE, ENGINE_MMS_ONNX):
        return requested
    # "auto" uses the offline model only when it is actually loadable,
    # otherwise falls back to edge-tts rather than failing the request.
    if requested == "auto":
        return ENGINE_MMS_ONNX if mms_available() else ENGINE_EDGE
    return ENGINE_EDGE


def license_ok_for_commercial(engine: str | None = None) -> bool:
    """False for models that cannot legally serve paying customers."""
    return (engine or active_engine()) != ENGINE_MMS_ONNX


def engine_info() -> dict:
    """Engine status for /health, so the UI can surface what it is talking to."""
    engine = active_engine()
    if engine == ENGINE_MMS_ONNX:
        return {
            "engine": ENGINE_MMS,
            "model": os.getenv("MMS_MODEL", "facebook/mms-tts-amh"),
            "available": mms_available(),
            "offline": True,
            "commercial_use": False,
            "license": "CC-BY-NC 4.0 (non-commercial; benchmark/demo only)",
        }
    return {
        "engine": ENGINE_EDGE,
        "model": "edge-tts",
        "available": True,
        "offline": False,
        "commercial_use": True,
        "license": "Edge neural voices (cloud, network required)",
    }


# ---------------------------------------------------------------------------
# MMS-TTS-amh via ONNX Runtime
# ---------------------------------------------------------------------------
_mms_session = None
_mms_state: dict = {}


def mms_available() -> bool:
    """True when onnxruntime and the model files are both present."""
    try:
        import onnxruntime  # noqa: F401
    except ImportError:
        return False
    return bool(os.getenv("MMS_ONNX_PATH") or os.getenv("MMS_MODEL"))


def _load_mms():
    """Load the VITS ONNX graph once and cache it for the process lifetime."""
    global _mms_session
    if _mms_session is not None:
        return _mms_session

    model_dir = os.getenv("MMS_ONNX_PATH")
    if not model_dir:
        raise RuntimeError(
            "MMS_ONNX_PATH is not set. Export facebook/mms-tts-amh to ONNX and "
            "point MMS_ONNX_PATH at the folder containing model.onnx."
        )
    path = os.path.join(model_dir, "model.onnx")
    if not os.path.isfile(path):
        raise RuntimeError(f"MMS ONNX model not found at {path}")

    import json

    import numpy as np
    import onnxruntime

    vocab_path = os.path.join(model_dir, "vocab.json")
    if not os.path.isfile(vocab_path):
        raise RuntimeError(f"MMS vocab.json not found at {vocab_path}")
    with open(vocab_path, encoding="utf-8") as fh:
        vocab = json.load(fh)

    meta = {}
    meta_path = os.path.join(model_dir, "meta.json")
    if os.path.isfile(meta_path):
        with open(meta_path, encoding="utf-8") as fh:
            meta = json.load(fh)

    options = onnxruntime.SessionOptions()
    options.intra_op_num_threads = int(os.getenv("MMS_THREADS", "2"))
    _mms_session = onnxruntime.InferenceSession(
        path, options, providers=["CPUExecutionProvider"]
    )
    _mms_state["np"] = np
    _mms_state["vocab"] = vocab
    _mms_state["add_blank"] = bool(meta.get("add_blank", True))
    _mms_state["rate"] = int(meta.get("sample_rate") or 16000)
    _mms_state["romanizer"] = _load_romanizer()
    return _mms_session


def _load_romanizer():
    """uroman romanizes Ethiopic to the Latin graphemes this VITS was trained on."""
    try:
        import uroman as ur
    except ImportError as exc:
        raise RuntimeError(
            "uroman is required for the offline engine (pip install uroman)"
        ) from exc
    return ur.Uroman()


def mms_text_to_ids(text: str) -> list[int]:
    """Ethiopic text -> romanized graphemes -> VITS token ids.

    mms-tts-amh is a uroman model, so the graph cannot be fed Ethiopic
    codepoints directly; the text is romanized first and each grapheme is
    mapped through vocab.json, interleaved with the blank token.
    """
    state = _mms_state
    if not state.get("romanizer"):
        _load_mms()
        state = _mms_state

    romanized = state["romanizer"].romanize_string(text or "")
    vocab = state["vocab"]
    blank = vocab.get("c", 0)

    ids = [blank] if state["add_blank"] else []
    for ch in romanized:
        token = vocab.get(ch)
        if token is None:
            continue
        ids.append(token)
        if state["add_blank"]:
            ids.append(blank)

    if len(ids) <= 1:
        raise RuntimeError(f"nothing romanizable in text: {text[:40]!r}")
    return ids


def mms_speak_wav(text: str, speed: float = 1.0) -> bytes:
    """Synthesize one Amharic string with MMS-TTS and return mono 16-bit WAV.

    speed > 1.0 is faster. Output is the model's native sample rate; the caller
    re-encodes to the shared 24 kHz MP3 container.
    """
    import numpy as np

    session = _load_mms()
    text = (text or "").strip()
    if not text:
        raise RuntimeError("empty text for mms_onnx")

    ids = mms_text_to_ids(text)
    inputs = {"input_ids": np.array([ids], dtype=np.int64)}
    audio = np.asarray(session.run(None, inputs)[0]).squeeze().astype(np.float32)

    if audio.size == 0:
        raise RuntimeError("offline engine returned no audio")

    if speed and speed != 1.0:
        # Resample by index selection: cheap, adequate for rate nudges.
        step = 1.0 / max(0.5, min(2.0, speed))
        audio = audio[:: max(1, int(round(step)))]

    peak = float(np.max(np.abs(audio)))
    if peak > 1.0:
        audio = audio / peak

    pcm = (audio * 32767.0).astype(np.int16)
    buffer = io.BytesIO()
    import soundfile as sf

    sf.write(
        buffer,
        pcm,
        _mms_state.get("rate", OFFLINE_SAMPLE_RATE),
        format="WAV",
        subtype="PCM_16",
    )
    return buffer.getvalue()