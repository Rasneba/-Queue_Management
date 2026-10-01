# Open TTS — Engineering Datasheet
**Product:** Neba Amharic TTS (Open TTS) | **Date:** 2026-10-01 | **Version:** 1.0.0
**Scope:** `tts-server/` only | **Stack:** FastAPI + edge-tts + vanilla JS + Neon Postgres (optional)

Use this sheet to rebuild, self-host, or replace the engine with your own offline model.

---

## 1. Product Identity

| Item | Value |
|---|---|
| Name | Neba Amharic TTS / Open TTS |
| Type | Multilingual neural TTS API + web studio |
| Engine today | Microsoft Edge Neural via `edge-tts>=7.2.0` (cloud-dependent) |
| Text front-end (yours, portable) | `amharic_normalizer.py` + `amharic_numbers.py` + `pronunciation.json` |
| Backend | `server.py` (FastAPI), Python 3.12.6 |
| Frontend | Dependency-free vanilla JS in `frontend/` (`index.html`, `app.js`, `styles.css`), built by `scripts/build.mjs` → `dist/` |
| Test console | `GET /test` (embedded HTML in `server.py:551`) |
| Design docs | `AMHARIC_TTS_DESIGN.html`, `PRODUCT_ROADMAP.html`, `README.md` |
| License risk | `facebook/mms-tts-amh` is CC-BY-NC 4.0 — benchmark only, not commercial. Shippable path = own VITS trained on licensed audio. |

## 2. Feature Summary

- Amharic-first normalization: numbers, ticket/ID codes (`P-42`), dates, times, currency (ETB), %, phones, acronyms (ERP/IT/SMS/AI/API/CEO), symbols, orthography (`ሐ/ኀ→ሀ`, context `ጸ→ፀ`).
- Voice selection: gender (female/male) × age (child/teen/adult/senior). Age = pitch/rate deltas (`AGE_TUNING` in `server.py:77`).
- Prosody: rate `-80%..+100%`, pitch `-100..+100Hz`, volume, pause 0-3, adaptive per-sentence rate, 6 styles (professional/friendly/happy/serious/calm/excited).
- Outputs: MP3 native, WAV/FLAC via `soundfile` @ 24 kHz mono PCM_16 (`audio_formats.py`).
- APIs: `/speak`, `/queue-speak`, `/normalize`, `/lexicon`, `/print-ticket` (Windows only), `/health`, accounts+credits if `DATABASE_URL` set.
- Resilience: per-segment synthesis, 3 retries, skip + `X-TTS-Warnings` header, 400 on unspeakable text, in-memory cache (200 entries).
- Accounts (optional): register/login/logout, sessions (SHA-256, 30d), API keys (`X-API-Key` or Bearer), 1 char = 1 credit, 10,000 signup grant, 402 on insufficient balance.

## 3. Technical Specifications

### 3.1 Languages & Voices

| Lang | Code | Female | Male | Notes |
|---|---|---|---|---|
| Amharic | `am` | `am-ET-MekdesNeural` | `am-ET-AmehaNeural` | 2 native voices |
| Oromo | `om` | `om-ET-MekdesNeural` | `en-US-BrianNeural` (fallback) | Male fallback is English |
| English | `en` | Ana(child)/Jenny(teen)/Aria(adult)/Michelle(senior) | Roger/Brian/Guy/Steffan | 8 voices, see `server.py:58-75` |

Age tuning: child `+5% rate, +22Hz`, teen `+2%, +10Hz`, adult `+0,+0`, senior `-8%, -14Hz`.

### 3.2 Audio

| Format | Media type | Source | Sample rate |
|---|---|---|---|
| mp3 | `audio/mpeg` | native edge-tts | 24 kHz / 48 kbps mono |
| wav | `audio/wav` | decode MP3 → `soundfile` PCM_16 | 24 kHz mono |
| flac | `audio/flac` | decode MP3 → `soundfile` PCM_16 | 24 kHz mono |

If `soundfile` missing, only `mp3` is advertised (`available_formats()`).

### 3.3 API Datasheet

Base URL local: `http://127.0.0.1:8765` (env `TTS_HOST`, `TTS_PORT`/`PORT`). CORS `*`, no auth on speech endpoints.

| Method | Path | Auth | Body / Query | Returns |
|---|---|---|---|---|
| GET | `/health` | none | — | `{status, voices, genders, ages, styles, formats, lexicon_entries, matrix}` |
| POST | `/speak` | optional Bearer/X-API-Key (billed if present) | `TTSRequest` JSON (see below) | audio bytes + `Content-Disposition: inline; filename="tts.{ext}"`, `X-TTS-Warnings` if skipped |
| POST | `/queue-speak` | none | `QueueRequest {ticket, counter, department?, + TTS fields}` | announcement audio |
| POST | `/normalize` | none | `{text, lang, style, age, rate, pitch, pause, adaptive, normalize}` | `{original, text, notes[], voice}` |
| GET | `/lexicon` | none | — | `{entries: {word: {say, alt}}}` |
| POST | `/lexicon` | none | `{word, say, alt?}` | `{status, count, word, say}` → persists `pronunciation.json` (ephemeral on Render) |
| POST | `/print-ticket` | none | `{id, name, department, service, checkInTime, estimatedWaitMinutes, qrDataUrl?}` | `{status, printer}` or 503 if no pywin32 |
| GET | `/test` | none | — | browser test panel |
| POST | `/auth/register` | none | `{email, password, name?}` | `{token, user}` + 10k credits, 409 on duplicate |
| POST | `/auth/login` | none | `{email, password}` | `{token}` |
| POST | `/auth/logout` | Bearer | — | revokes session |
| GET | `/me`, `/credits`, `/usage`, `/history?limit=25`, `/keys` | Bearer/X-API-Key | — | profile / ledger / aggregates / history / keys |
| POST | `/keys` / DELETE | Bearer | `{name?}` | secret shown once |
| GET | `/db/health` | none | — | `{ok, version}` or 503 if no DB |

`TTSRequest` defaults (`server.py:135`):
```json
{"text":"...","lang":"am","gender":"female","age":"adult","style":"professional",
"rate":"-10%","pitch":"+0Hz","volume":"+0%","pause":1,"adaptive":true,"normalize":true,"format":"mp3"}
```

Example:
```bash
curl -s http://127.0.0.1:8765/health | python -m json.tool
curl -X POST http://127.0.0.1:8765/speak -H "Content-Type: application/json" \
  -d "{\"text\":\"እንግዳ ቁጥር 42 ወደ መቀበያ ቁጥር 3 ይምጡ\",\"format\":\"wav\"}" --output sample.wav
```

### 3.4 Database (optional, Neon Postgres 18)

Enabled only if `DATABASE_URL` set. Schema: `schema.sql` (idempotent). Tables: `users`, `sessions` (30d, SHA-256), `api_keys` (SHA-256, prefix-masked, soft revoke), `credit_ledger` (append-only, `signup`/`speak`), `usage_events`, `tts_requests` (SET NULL on user delete). Apply: `python -c "import asyncio; from database import db; asyncio.run(db.apply_schema())"`.

Env vars: `DATABASE_URL` (server only, never `VITE_`), `SESSION_SECRET` (must set in prod), `PORT/TTS_PORT/TTS_HOST`, `VITE_API_BASE_URL` (build-time only, baked to `dist/assets/config.js`).

## 4. Bill of Materials (BOM)

### 4.1 Software BOM
```
edge-tts>=7.2.0, fastapi>=0.110.0, uvicorn>=0.29.0, soundfile>=0.12.0, numpy>=1.26.0
pillow>=10.0.0, asyncpg>=0.31.0, python-dotenv>=1.0.0
Windows-only (manual): pywin32>=306
Node >=18 (frontend build only, zero runtime deps)
```
`requirements.txt` deliberately excludes `pywin32` (breaks Linux/Vercel builds).

### 4.2 Hardware BOM — run current engine
| Tier | CPU | RAM | GPU | Notes |
|---|---|---|---|---|
| Dev/local | 2 vCPU | 2 GB | none | `python server.py`, loopback |
| Demo (Render free) | shared | 512 MB | none | sleeps 15 min idle, ~1 min cold start, ephemeral disk |
| Prod API | 2 vCPU | 2-4 GB | none | + Neon Postgres pooled, rate-limit, auth |

### 4.3 Hardware BOM — own offline model (future)
| Model | Infer VRAM/RAM | Train | CPU usable? |
|---|---|---|---|
| MMS-TTS-amh / ONNX (36M) | <0.5 GB | n/a (NC) | yes, excellent |
| VITS fine-tune (own data) | 1-2 GB | 4-6 GB GPU | slow but ok |
| FastSpeech2+HiFiGAN | <2 GB | 4-8 GB | yes |
| F5-TTS / FishSpeech | 8-14 GB GPU | 10-24 GB | no (GPU needed) |
| Orpheus / Zonos | 12-20 GB GPU | — | no |

Data need for own VITS: 1-5h clean single-speaker licensed audio (best: in-house queue announcements), 16.9k-clip `snapwre/amharic-speech` (CC-BY-4.0) for starter, normalize transcripts with existing normalizer, 1-15s clips, speaker-aware splits.

## 5. Build Instructions (from zero)

```bash
# 1. API
pip install -r requirements.txt
python server.py  # http://127.0.0.1:8765  | /test panel | /health

# 2. Frontend static (Vercel)
npm run build  # node scripts/build.mjs -> dist/
# set VITE_API_BASE_URL=https://<your-render-service>.onrender.com BEFORE build

# 3. Deploy API (Render Blueprint render.yaml)
# build: pip install --no-cache-dir -r requirements.txt | start: python server.py
# health: /health | env: DATABASE_URL (Neon, sync:false), TTS_HOST=0.0.0.0, PYTHON_VERSION=3.12.6

# 4. Optional DB
python -c "import asyncio; from database import db; asyncio.run(db.apply_schema())"
```

Frontend routes: public `/ /features /demo /pricing /docs /api /about /contact /login /register`, workspace `/dashboard/*`, admin scaffold frontend-only.

## 6. Performance, Limits & Security

- Latency: edge-tts streaming per segment + concat; cache hit = instant (still billed/logged).
- Limits: 200-entry RAM cache, 3 attempts/segment with `0.6*(n+1)^2` backoff, open CORS, no rate limit, no auth on `/speak` (demo-ok, prod-not-ok).
- Known debt (see `PRODUCT_ROADMAP.html` §5): lexicon on disk (wiped on Render restart → move to Postgres), `SESSION_TTL_DAYS` ignored (hardcoded 30d), scopes/is_active unenforced, no password reset/email, history has no audio playback (needs S3/R2 + `audio_url` col), `duration_ms/warnings` unpopulated.
- Before charging money (P0): Chapa/Telebirr server-side verify, per-key/IP rate limit (429), real `SESSION_SECRET` + least-privilege Neon role, password reset.

## 7. Verification Checklist
```bash
node --check frontend/app.js; npm run build
node render_check.mjs dist
python server.py & node render_live.mjs dist http://127.0.0.1:8765
python test_accounts.py && python cleanup_tests.py
curl -s http://127.0.0.1:8765/health | python -m json.tool
```
Rule: `render_check` fail → don't deploy (blank-page guard). Metering fail → don't deploy (billing wrong).

## 8. Open-Model Replacement Slot

Keep `normalize → lexicon → prosody` as permanent front-end. Swap only `synth_mp3/_stream_segment` behind a backend interface. Grapheme VITS first (avoids brittle G2P); explicit phonemes (HornMorpho GPL-3.0 = separate process only, custom Ethiopic rules, eSpeak-NG) only if fine-tune still mispronounces `ፀ/ጸ/ጠ/ተ`, `ሀ/ኀ/ሐ`, gemination.

---
*Generated from `server.py`, `audio_formats.py`, `requirements.txt`, `schema.sql`, `render.yaml`, `vercel.json`, `README.md`, `AMHARIC_TTS_DESIGN.html`, `PRODUCT_ROADMAP.html`.*
