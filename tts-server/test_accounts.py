"""End-to-end check of auth, credits, usage, history and API keys."""
import json
import urllib.error
import urllib.request
import uuid

BASE = "http://127.0.0.1:8765"


def call(method, path, body=None, token=None, api_key=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if api_key:
        req.add_header("X-API-Key", api_key)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read()
            ctype = resp.headers.get("Content-Type", "")
            if "json" in ctype:
                return resp.status, json.loads(raw)
            return resp.status, f"<{len(raw)} bytes {ctype}>"
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read() or b"{}")


email = f"t-{uuid.uuid4().hex[:10]}@example.com"
status, reg = call("POST", "/auth/register", {"email": email, "password": "correct-horse-1", "name": "Test"})
print("register      ", status, reg)
token = reg["token"]
print("duplicate reg ", call("POST", "/auth/register", {"email": email, "password": "correct-horse-1"})[0], "(expect 409)")
print("bad password  ", call("POST", "/auth/login", {"email": email, "password": "nope"})[0], "(expect 401)")
print("login         ", call("POST", "/auth/login", {"email": email, "password": "correct-horse-1"})[0])
print("me            ", *call("GET", "/me", token=token))
print("no auth /me   ", call("GET", "/me")[0], "(expect 401)")

before = call("GET", "/credits", token=token)[1]["balance"]
print("speak (authed)", *call("POST", "/speak", {"text": "እንግዳ ቁጥር 42", "format": "mp3"}, token=token))
after = call("GET", "/credits", token=token)[1]["balance"]
print("credits       ", before, "->", after, "cost", before - after)

print("speak (anon)  ", *call("POST", "/speak", {"text": "እንግዳ ቁጥር 43", "format": "mp3"}))
print("usage         ", call("GET", "/usage", token=token)[1]["totals"])
hist = call("GET", "/history", token=token)[1]["items"]
print("history rows  ", len(hist), "| latest:", hist[0]["input_text"], "->", hist[0]["spoken_text"][:40], "|", hist[0]["credits"], "cr")

status, key = call("POST", "/keys", {"name": "ci"}, token=token)
raw_key = key["key"]
print("key create    ", status, key["key_prefix"], "| full key returned once:", raw_key[:14] + "...")
print("key list      ", call("GET", "/keys", token=token)[1]["items"])
print("speak via key ", *call("POST", "/speak", {"text": "በክር ተሳትፍ", "format": "mp3"}, api_key=raw_key))
print("bad key       ", call("GET", "/me", api_key="neba_live_bogus")[0], "(expect 401)")
print("key revoke    ", call("DELETE", f"/keys/{key['id']}", token=token))
print("revoked key   ", call("GET", "/me", api_key=raw_key)[0], "(expect 401)")
print("logout        ", call("POST", "/auth/logout", token=token))
print("after logout  ", call("GET", "/me", token=token)[0], "(expect 401)")
