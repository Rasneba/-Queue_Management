# Amharic TTS Server

FastAPI service around `edge-tts` (Microsoft Edge neural voices) with an
Amharic-first text normalization layer, voice selection by **gender + age**,
adjustable **speed / pitch / volume / pauses**, speaking **styles**, and
download-ready output in **MP3, WAV and FLAC**.

Amharic voices: `am-ET-MekdesNeural` (female), `am-ET-AmehaNeural` (male).
Oromo: `om-ET-MekdesNeural` (female). English: a set of neural voices.

## Run

```bash
pip install -r requirements.txt
python server.py            # http://localhost:8765
```

Then open the Neba workspace: <http://localhost:8765/>

The product frontend is a dependency-free prototype served by FastAPI. It includes
public landing, demo, pricing and documentation pages, plus a client-side user
workspace with TTS Studio, history, credits, usage, API keys, billing, settings,
and an admin preview. The studio connects to the existing `/speak` and
`/normalize` endpoints, so generated audio works when the speech dependencies are
installed. The existing engineering test panel remains available at
<http://localhost:8765/test>.

This phase is frontend-only: auth, database persistence, payment verification,
object storage, queues, and real API-key enforcement are intentionally represented
as UI scaffolding. They should be added behind the current API before using this
as a production SaaS.

## Deploy the frontend to Vercel

The repository includes a zero-dependency Node build for the frontend, so Vercel
will build `frontend/` into `dist/` without trying to install the Python speech
server:

```bash
npm run build
npx vercel --prod
```

For a working hosted demo, add this Vercel environment variable:

```text
VITE_API_BASE_URL=https://your-deployed-fastapi-service.example.com
```

It is read at **build time**: `scripts/build.mjs` writes `dist/assets/config.js`,
which `app.js` picks up from `window.__NEB_CONFIG__`. There is no bundler here,
so `import.meta.env` is unavailable at runtime and the env var must be set before
the build, not only at runtime. A rebuild is required after changing it.

If it is not set, the public site and workspace still render as a UI preview and
the generation buttons explain that the speech API is not connected. Keep the
FastAPI service on a separate backend host; Vercel should host the frontend.

The Windows-only `pywin32` printer dependency is deliberately not installed from
`requirements.txt`, because it cannot be resolved on Vercel's Linux build image.
Install it separately on Windows only if `/print-ticket` is needed.

Environment variable `TTS_PORT` changes the local server port (default `8765`),
and `TTS_HOST` changes the bind address (default `127.0.0.1`, which is the safe
choice: the API has no authentication and CORS is open).

## Host the API free on Render

The speech endpoints need a Python process, so the Vercel static site cannot
serve them. Render's free web service is the simplest host (no card required).

1. Push the repo, then create the service from `render.yaml`:
   <https://render.com/deploy> (or *New -> Blueprint* and point it at the repo).
2. Render prompts for `DATABASE_URL`. Paste your Neon connection string
   (`postgresql://...`). Prefer a least-privilege role over `neondb_owner`, and
   rotate any credential that was ever pasted into a chat or committed.
3. After the deploy, verify `https://<your-service>.onrender.com/health`
   returns `{"ok": true}`. Cold starts take up to ~1 minute.
4. Point the frontend at it. In **Vercel -> Settings -> Environment Variables**
   add `VITE_API_BASE_URL=https://<your-service>.onrender.com`, then redeploy
   (the value is baked into `dist/assets/config.js` at build time).
5. Confirm CORS by loading the site and generating audio.

Free-tier behaviour to expect: the container sleeps after 15 minutes without
traffic and the next request waits for it to wake; that is a ~1 minute delay,
not an error. The filesystem is ephemeral, so `pronunciation.json` edits made
through `POST /lexicon` do not survive a restart. Durable data lives in Neon.

`server.py` binds `0.0.0.0` automatically when the platform sets `PORT`, and
stays on `127.0.0.1` locally. `TTS_HOST` overrides this. Note the service is
unauthenticated with open CORS, which is acceptable only while it is used as a
demo; put it behind auth and a rate limit before inviting real users.

## Frontend checks


The built site is verified in a real DOM before deploying, in two modes:

``bash
npm install -D jsdom
npm run build
node render_check.mjs dist                      # preview mode, asserts no script errors
node render_live.mjs dist http://127.0.0.1:8765  # register -> speak -> history against a live API
``

ender_check.mjs loads dist/assets/app.js in jsdom and fails on any script
error, so a broken build never reaches production. This is how the blank-page
regression (import "./styles.css" in a build with no bundler) is caught.

## Local test

```bash
curl -s http://127.0.0.1:8765/health | python -m json.tool
curl -s -X POST http://127.0.0.1:8765/speak -H "Content-Type: application/json" \
  -d "{\"text\":\"áŠ¥áŠ•áŒá‹³ á‰áŒ¥áˆ­ 42 á‹ˆá‹° áˆ˜á‰€á‰ á‹« á‰áŒ¥áˆ­ 3 á‹­áˆáŒ¡\",\"format\":\"wav\"}" \
  --output sample.wav
```

```python
import requests
r = requests.post("http://127.0.0.1:8765/speak", json={"text": "áŠ¥áŠ•áŒá‹³ á‰áŒ¥áˆ­ 42", "format": "mp3"})
open("sample.mp3", "wb").write(r.content)
```

## Architecture

```text
client -> FastAPI (/speak, /queue-speak, /normalize)
           -> amharic_normalizer  numbers, dates, phones, acronyms, symbols,
                                  orthography, segmentation, per-sentence rate
           -> pronunciation.json  custom word -> spoken form
           -> synth_mp3           edge-tts streaming per segment, 3 attempts,
                                  skipped segments reported in X-TTS-Warnings
           -> audio_formats       mp3 (native) | wav | flac, resampled to 24 kHz mono
```

See [`AMHARIC_TTS_DESIGN.html`](./AMHARIC_TTS_DESIGN.html) for the full design
document: architecture, Edge-TTS gap analysis, and a phased plan to replace it
with your own Amharic model (licensing constraints, data, G2P, training and
inference runtimes, and what to benchmark before shipping).

## What it does better than plain edge-tts

| Area | How |
| --- | --- |
| Numbers | `42` -> `áŠ áˆ­á‰£ áˆáˆˆá‰µ`, decimals, ordinals (`1áŠ›` -> `áˆ˜áŒ€áˆ˜áˆªá‹«`) |
| Ticket / ID codes | `P-42` -> `á’ áŠ áˆ­á‰£ áˆáˆˆá‰µ`, `CARD-102` -> `áŠ«áˆ­á‹µ áˆ˜á‰¶ áˆáˆˆá‰µ` |
| Dates & times | `2024-05-12` -> `áˆœá‹­ áŠ áˆµáˆ« áˆáˆˆá‰µáŠ› ... á‹“.áˆ`, `14:30` -> `áŠ áˆµáˆ« áŠ áˆ«á‰µ áˆ°á‹“á‰µ áˆ°áˆ‹áˆ³ á‹°á‰‚á‰ƒ` |
| Currency | `12,500 ETB` -> `áŠ áˆµáˆ« áˆáˆˆá‰µ áˆºáˆ… áŠ áˆáˆµá‰µ áˆ˜á‰¶ á‰¥áˆ­` |
| Percentages | `85%` -> `áˆ°áˆ›áŠ•á‹« áŠ áˆáˆµá‰µ á‰ áˆ˜á‰¶` |
| Phone numbers | `0911223344` -> `áˆµáˆáŠ­ á‹œáˆ® á‹˜áŒ áŠ™ áŠ áŠ•á‹µ ...` |
| Acronyms | `ERP` -> `áŠ¢ áŠ  á`, `IT` -> `áŠ á‹­ á‰²`, `SMS`, `AI`, `API`, `CEO`, ... |
| Technical terms | English words inside Amharic sentences are translated (`Customer Support` -> `á‹¨á‹°áŠ áŠ•á‰°áŠ› á‹µáŒ‹á`) |
| Symbols | `&` -> `áŠ¥áŠ“`, `@` -> `áŠ¢áˆœá‹­áˆ`, `Â°`, `Ã—`, ... |
| Orthography | `áˆ`/`áŠ€` -> `áˆ€`; `á‹“áˆˆáˆ` -> `áŠ áˆˆáˆ` (context-aware, not blanket) |
| Prosody | sentence splitting, question marks for rising intonation, per-sentence adaptive rate (hard words are slowed, short phrases quickened), configurable pause length |
| Styles | professional, friendly, happy, serious, calm, excited |
| Voice | female/male x child/teen/adult/senior (age also shifts pitch and rate) |
| Output | MP3 (native), WAV and FLAC via libsndfile |

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | voices, styles, formats, voice matrix |
| GET | `/test` | browser test panel |
| POST | `/speak` | free text -> audio |
| POST | `/queue-speak` | ticket + counter -> announcement audio |
| POST | `/normalize` | shows the spoken form and every change made |
| GET/POST | `/lexicon` | read / add pronunciation dictionary entries |
| POST | `/print-ticket` | optional thermal ticket printing (pywin32) |

`/speak` retries each segment three times. Segments the engine cannot pronounce
are skipped rather than failing the request, and reported in the
`X-TTS-Warnings` response header. Text with nothing speakable (punctuation only,
whitespace only) returns `400`.

`speak` / `queue-speak` parameters:

```json
{
  "text": "áŠ¥áŠ•áŒá‹³ á‰áŒ¥áˆ­ 42 á‹ˆá‹° áˆ˜á‰€á‰ á‹« á‰áŒ¥áˆ­ 3 á‹­áˆáŒ¡",
  "lang": "am",
  "gender": "female",
  "age": "adult",
  "style": "professional",
  "rate": "-10%",
  "pitch": "+0Hz",
  "volume": "+0%",
  "pause": 1,
  "adaptive": true,
  "normalize": true,
  "format": "mp3"
}
```

`format`: `mp3` | `wav` | `flac`.

## Accounts, credits and history (optional)

Set `DATABASE_URL` to a PostgreSQL/Neon connection string and the service gains
accounts, credits, usage and API keys. Without it the speech API works exactly
as before and the account endpoints return `503`.

```text
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

Put it in `.env` (gitignored, never committed) or set it in the environment.
Apply the schema once:

```bash
python -c "import asyncio; from database import db; asyncio.run(db.apply_schema())"
```

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | create an account, returns a session token and 10,000 credits |
| POST | `/auth/login` | exchange email + password for a session token |
| POST | `/auth/logout` | revoke the current session |
| GET | `/me` | current user from a session token or API key |
| GET | `/credits` | balance and recent ledger entries |
| GET | `/usage` | characters, credits and requests, with a daily series |
| GET | `/history` | recent synthesis history for the account |
| GET/POST | `/keys` | list / create API keys (the full key is returned once) |
| DELETE | `/keys/{id}` | revoke an API key |
| GET | `/db/health` | database connectivity and server version |

Authenticate with `Authorization: Bearer <session-token>` or `X-API-Key: <key>`.
Passwords use PBKDF2-HMAC-SHA256 (210k iterations). Session tokens and API keys
are random secrets stored only as SHA-256 digests, so the database never holds a
usable credential. Authenticated `/speak` calls cost 1 credit per input
character, debited inside a transaction that refuses to go negative; anonymous
calls are neither billed nor written to the database.

Tables: `users`, `sessions`, `api_keys`, `credit_ledger`, `usage_events`,
`tts_requests` (see `schema.sql`).

## Pronunciation dictionary / custom vocabulary

`POST /lexicon {"word": "Lancet", "say": "áˆ‹áŠ•áˆµá‰µ"}` persists to
`pronunciation.json` (word -> spoken form, optional `alt`). Entries are applied
before synthesis, so a name or a department label always sounds the same.

## Known limits

* Phoneme-level distinctions (`á€/áŒ¸/áŒ /á‰°`, `áˆ€/áŠ€/áˆ`, gemination) are decided by
  Microsoft's Amharic G2P, not by this service. The orthography rules and the
  lexicon are the available levers; fixing them properly needs a different
  engine or a fine-tuned model.
* Style and age are emulated with rate/pitch, not with trained emotional voices.
* Training a native Amharic model needs a dataset -> normalization -> G2P ->
  lexicon -> acoustic model -> prosody -> vocoder -> evaluation pipeline. This
  repo covers normalization, lexicon and prosody; the rest is out of scope.
* If you move off Edge-TTS, note that `facebook/mms-tts-amh` is **CC-BY-NC 4.0**
  (benchmark only, not commercial) and needs `uroman` Romanisation before
  synthesis. An own VITS fine-tune on licensed audio is the shippable path.

