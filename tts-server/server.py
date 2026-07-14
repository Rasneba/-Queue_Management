import asyncio
import io
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, HTMLResponse
from pydantic import BaseModel
import edge_tts
from amharic_numbers import build_queue_announcement, number_to_amharic, ticket_to_amharic

app = FastAPI(title="Lancet TTS Server")

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

SPEAK_CACHE: dict[str, bytes] = {}


class TTSRequest(BaseModel):
    text: str
    lang: str = "am"
    rate: str = "-10%"
    pitch: str = "+0Hz"


@app.get("/health")
async def health():
    return {"status": "ok", "voices": list(VOICE_MAP.values())}


@app.post("/speak")
async def speak(req: TTSRequest):
    cache_key = f"{req.lang}:{req.rate}:{req.pitch}:{req.text}"
    if cache_key in SPEAK_CACHE:
        return Response(
            content=SPEAK_CACHE[cache_key],
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=tts.mp3"},
        )

    voice = VOICE_MAP.get(req.lang, VOICE_MAP["am"])

    try:
        communicate = edge_tts.Communicate(
            text=req.text,
            voice=voice,
            rate=req.rate,
            pitch=req.pitch,
        )

        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])

        if audio_buffer.tell() == 0:
            raise HTTPException(status_code=500, detail="No audio data generated")

        audio_buffer.seek(0)
        audio_bytes = audio_buffer.read()

        if len(SPEAK_CACHE) < 200:
            SPEAK_CACHE[cache_key] = audio_bytes

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=tts.mp3"},
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class QueueRequest(BaseModel):
    ticket: str
    counter: str
    lang: str = "am"
    department: str | None = None
    rate: str = "-10%"
    pitch: str = "+0Hz"


@app.post("/queue-speak")
async def queue_speak(req: QueueRequest):
    text = build_queue_announcement(req.ticket, req.counter, req.lang, req.department)
    voice = VOICE_MAP.get(req.lang, VOICE_MAP["am"])
    cache_key = f"q:{req.lang}:{req.ticket}:{req.counter}"

    if cache_key in SPEAK_CACHE:
        return Response(
            content=SPEAK_CACHE[cache_key],
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=queue.mp3"},
        )

    try:
        communicate = edge_tts.Communicate(
            text=text, voice=voice, rate=req.rate, pitch=req.pitch,
        )
        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])

        if audio_buffer.tell() == 0:
            raise HTTPException(status_code=500, detail="No audio data generated")

        audio_buffer.seek(0)
        audio_bytes = audio_buffer.read()
        if len(SPEAK_CACHE) < 200:
            SPEAK_CACHE[cache_key] = audio_bytes

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=queue.mp3"},
        )
    except HTTPException:
        raise
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
  .btn-preset{background:#1e3a5f;color:#93c5fd;border:1px solid #1e40af;font-size:11px;padding:6px 12px}
  .lang-btn{background:#334155;color:#94a3b8}
  .lang-btn.active{background:#3b82f6;color:#fff}
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
    <button class="lang-btn active" onclick="setLang('am',this)">አማርኛ</button>
    <button class="lang-btn" onclick="setLang('om',this)">Afaan Oromoo</button>
    <button class="lang-btn" onclick="setLang('en',this)">English</button>
  </div>
</div>

<div class="card">
  <h2>Type and Speak (free text)</h2>
  <textarea id="textInput" rows="2" placeholder="Type any Amharic/English text...">እንግዳ ቁጥር አርባ ሁለት ወደ መቀበያ ቁጥር ሶስት ይምጡ</textarea>
  <div class="row">
    <button class="btn-speak" onclick="speakFree()">Speak</button>
    <button class="btn-stop" onclick="stopAudio()">Stop</button>
  </div>
  <div id="status" class="status"></div>
</div>

<div class="card">
  <h2>Queue Announcer (ticket + counter)</h2>
  <div class="row" style="margin-bottom:8px">
    <input id="ticketInput" placeholder="Ticket (e.g. P-1)" value="P-1" style="flex:1">
    <input id="counterInput" placeholder="Counter" value="3" style="width:80px">
    <button class="btn-speak" style="flex:0 0 auto;padding:8px 20px" onclick="speakQueue()">Announce</button>
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
let currentLang='am';
const AMHARIC={1:'አንድ',2:'ሁለት',3:'ሦስት',4:'አራት',5:'አምስት',6:'ስድስት',7:'ሰባት',8:'ስምንት',9:'ዘጠኙ',10:'አስር',20:'ሀያ',30:'ሰላሳ',40:'አርባ',50:'ሀምሳ',60:'ስድሳ',70:'ሰባ',80:'ሰማንያ',90:'ዘጠና',100:'መቶ',11:'አስራ አንድ',12:'አስራ ሁለት',13:'አስራ ሦስት',14:'አስራ አራት',15:'አስራ አምስት',16:'አስራ ስድስት',17:'አስራ ሰባት',18:'አስራ ስምንት',19:'አስራ ዘጠኙ',21:'ሀያ አንድ',22:'ሀያ ሁለት',23:'ሀያ ሦስት',24:'ሀያ አራት',25:'ሀያ አምስት',31:'ሰላሳ አንድ',32:'ሰላሳ ሁለት',33:'ሰላሳ ሦስት',41:'አርባ አንድ',42:'አርባ ሁለት',43:'አርባ ሦስት',51:'ሀምሳ አንድ',52:'ሀምሳ ሁለት',55:'ሀምሳ አምስት',61:'ስድሳ አንድ',63:'ስድሳ ሶስት',71:'ሰባ አንድ',73:'ሰባ ሦስት',81:'ሰማንያ አንድ',85:'ሰማንያ አምስት',91:'ዘጠና አንድ',99:'ዘጠና ዘጠኝ'};

function amharicNum(n){if(AMHARIC[n])return AMHARIC[n];if(n<10)return AMHARIC[n]||String(n);const t=Math.floor(n/10)*10,o=n%10;if(o===0)return AMHARIC[t]||String(n);return(AMHARIC[t]||'')+' '+(AMHARIC[o]||String(o))}

function buildNumberGrid(){const g=document.getElementById('numGrid');const ns=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,30,40,42,43,45,50,52,55,60,63,65,70,73,75,80,85,90,99,100];g.innerHTML=ns.map(n=>'<button class="num-btn" onclick="speakNumber('+n+')"><span class="am">'+amharicNum(n)+'</span><span class="latin">'+n+'</span></button>').join('')}

function buildQueueDemo(){const d=document.getElementById('queueDemo');const ts=[{t:'P-1',c:'Room 2'},{t:'P-2',c:'Room 4'},{t:'P-3',c:'Trauma 1'},{t:'P-4',c:'Room 3'},{t:'P-5',c:'Room 5'},{t:'P-42',c:'Room 1'},{t:'P-100',c:'Reception 1'}];d.innerHTML=ts.map(x=>'<div class="queue-row"><span class="ticket">'+x.t+'</span><span class="room">Counter: '+x.c+'</span><button class="btn-preset" onclick="quickQueue(\\''+x.t+'\\',\\''+x.c+'\\')">Play</button></div>').join('')}

function setLang(lang,btn){currentLang=lang;document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active')}

let audioEl=null;
function showStatus(c,m){const e=document.getElementById('status');e.className='status '+c;e.textContent=m}

async function speakFree(){const t=document.getElementById('textInput').value.trim();if(!t)return;showStatus('loading','Generating...');try{const r=await fetch('/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:t,lang:currentLang,rate:'-10%',pitch:'+0Hz'})});if(!r.ok)throw new Error(r.status);const b=await r.blob();play(URL.createObjectURL(b))}catch(e){showStatus('error','Error: '+e.message)}}

async function speakQueue(){const t=document.getElementById('ticketInput').value.trim();const c=document.getElementById('counterInput').value.trim();if(!t||!c)return;showStatus('loading','Generating queue announcement...');try{const r=await fetch('/queue-speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticket:t,counter:c,lang:currentLang,rate:'-10%',pitch:'+0Hz'})});if(!r.ok)throw new Error(r.status);const b=await r.blob();play(URL.createObjectURL(b))}catch(e){showStatus('error','Error: '+e.message)}}

function quickQueue(t,c){document.getElementById('ticketInput').value=t;document.getElementById('counterInput').value=c;speakQueue()}

function speakNumber(n){document.getElementById('textInput').value=amharicNum(n);speakFree()}

function play(url){if(audioEl){audioEl.pause()}audioEl=new Audio(url);audioEl.onplay=()=>showStatus('playing','Playing...');audioEl.onended=()=>showStatus('','');audioEl.onerror=()=>showStatus('error','Playback error');audioEl.play()}
function stopAudio(){if(audioEl){audioEl.pause();audioEl=null}showStatus('','')}

buildNumberGrid();buildQueueDemo();
</script>
</body>
</html>"""


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("TTS_PORT", "8765"))
    print(f"Starting edge-tts server on http://localhost:{port}")
    print(f"Test page: http://localhost:{port}/test")
    uvicorn.run(app, host="0.0.0.0", port=port)
