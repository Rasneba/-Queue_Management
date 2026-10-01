"""Account, credits, API keys and synthesis history backed by Postgres.

Password hashing uses PBKDF2-HMAC-SHA256 from the standard library, so this adds
no native dependency. Session tokens and API keys are random secrets that are
stored only as SHA-256 digests: losing the database loses the tokens, never the
credentials themselves.
"""
import hashlib
import hmac
import os
import secrets
import time
from datetime import datetime, timedelta, timezone

from database import db

PBKDF2_ITERATIONS = 210_000
SESSION_TTL_DAYS = 30
SIGNUP_CREDITS = 10_000
CREDITS_PER_CHARACTER = 1


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = encoded.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(candidate.hex(), digest_hex)


def new_session_token() -> str:
    return secrets.token_urlsafe(32)


def new_api_key() -> tuple[str, str, str]:
    """Return (full_key, prefix, hash). The full key is shown to the user once."""
    raw = f"neba_live_{secrets.token_urlsafe(32)}"
    return raw, raw[:16], _digest(raw)


async def create_user(email: str, name: str, password: str) -> dict:
    email = email.strip().lower()
    record = await db.fetch_one("SELECT id FROM users WHERE email = $1", email)
    if record:
        raise ValueError("An account with that email already exists.")
    row = await db.fetch_one(
        """INSERT INTO users (email, name, password_hash, credits_balance)
           VALUES ($1, $2, $3, $4)
           RETURNING id, email, name, credits_balance, created_at""",
        email,
        name.strip(),
        hash_password(password),
        SIGNUP_CREDITS,
    )
    await db.execute(
        """INSERT INTO credit_ledger (user_id, delta, reason, balance_after)
           VALUES ($1, $2, 'signup', $2)""",
        row["id"],
        SIGNUP_CREDITS,
    )
    return dict(row)


async def authenticate(email: str, password: str) -> dict | None:
    row = await db.fetch_one(
        "SELECT id, email, name, password_hash, credits_balance FROM users WHERE email = $1 AND is_active",
        email.strip().lower(),
    )
    if not row or not verify_password(password, row["password_hash"]):
        return None
    return dict(row)


async def issue_session(user_id: int) -> str:
    token = new_session_token()
    expires = datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
    await db.execute(
        "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
        user_id,
        _digest(token),
        expires,
    )
    return token


async def resolve_session(token: str) -> dict | None:
    row = await db.fetch_one(
        """SELECT u.id, u.email, u.name, u.credits_balance
             FROM sessions s JOIN users u ON u.id = s.user_id
            WHERE s.token_hash = $1 AND s.revoked_at IS NULL
              AND s.expires_at > now() AND u.is_active""",
        _digest(token),
    )
    return dict(row) if row else None


async def revoke_session(token: str) -> None:
    await db.execute(
        "UPDATE sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL",
        _digest(token),
    )


async def resolve_api_key(raw_key: str) -> dict | None:
    row = await db.fetch_one(
        """SELECT u.id, u.email, u.name, u.credits_balance
             FROM api_keys k JOIN users u ON u.id = k.user_id
            WHERE k.key_hash = $1 AND k.revoked_at IS NULL AND u.is_active""",
        _digest(raw_key),
    )
    if row:
        await db.execute("UPDATE api_keys SET last_used_at = now() WHERE key_hash = $1", _digest(raw_key))
    return dict(row) if row else None


async def create_api_key(user_id: int, name: str) -> dict:
    raw, prefix, key_hash = new_api_key()
    row = await db.fetch_one(
        """INSERT INTO api_keys (user_id, name, key_prefix, key_hash)
           VALUES ($1, $2, $3, $4) RETURNING id, name, key_prefix, created_at""",
        user_id,
        name.strip() or "default",
        prefix,
        key_hash,
    )
    return {**dict(row), "key": raw}


async def list_api_keys(user_id: int) -> list[dict]:
    rows = await db.fetch_all(
        """SELECT id, name, key_prefix, created_at, last_used_at, revoked_at
             FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC""",
        user_id,
    )
    return [dict(r) for r in rows]


async def revoke_api_key(user_id: int, key_id: int) -> bool:
    result = await db.execute(
        "UPDATE api_keys SET revoked_at = now() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL",
        key_id,
        user_id,
    )
    return result.endswith("1")


async def charge(user_id: int | None, characters: int, reason: str = "speak") -> tuple[int, int]:
    """Debit credits and record usage. Returns (credits_charged, new_balance)."""
    cost = max(1, characters) * CREDITS_PER_CHARACTER if user_id else 0
    if not user_id:
        await db.execute(
            "INSERT INTO usage_events (user_id, kind, characters, credits) VALUES (NULL, $1, $2, 0)",
            reason,
            characters,
        )
        return 0, -1
    async with db.transaction() as conn:
        row = await conn.fetchrow(
            """UPDATE users SET credits_balance = credits_balance - $2
                WHERE id = $1 AND credits_balance >= $2
            RETURNING credits_balance""",
            user_id,
            cost,
        )
        if not row:
            raise ValueError("Insufficient credits")
        balance = row["credits_balance"]
        await conn.execute(
            "INSERT INTO credit_ledger (user_id, delta, reason, balance_after) VALUES ($1, $2, $3, $4)",
            user_id,
            -cost,
            reason,
            balance,
        )
        await conn.execute(
            "INSERT INTO usage_events (user_id, kind, characters, credits) VALUES ($1, $2, $3, $4)",
            user_id,
            reason,
            characters,
            cost,
        )
    return cost, balance


async def record_request(
    user_id: int | None,
    *,
    request_id: str,
    input_text: str,
    spoken_text: str | None,
    voice: str,
    gender: str | None,
    age: str | None,
    style: str | None,
    audio_format: str,
    characters: int,
    credits: int,
    audio_bytes: int,
    duration_ms: int | None,
    warnings: list[str] | None,
) -> None:
    await db.execute(
        """INSERT INTO tts_requests
             (user_id, request_id, input_text, spoken_text, voice, gender, age, style,
              audio_format, characters, credits, audio_bytes, duration_ms, warnings)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)""",
        user_id,
        request_id,
        input_text,
        spoken_text,
        voice,
        gender,
        age,
        style,
        audio_format,
        characters,
        credits,
        audio_bytes,
        duration_ms,
        "; ".join(warnings or []) or None,
    )


async def usage_summary(user_id: int, days: int = 30) -> dict:
    totals = await db.fetch_one(
        """SELECT COALESCE(SUM(characters),0) AS characters,
                  COALESCE(SUM(credits),0)    AS credits,
                  COUNT(*)                    AS requests
             FROM usage_events WHERE user_id = $1""",
        user_id,
    )
    daily = await db.fetch_all(
        """SELECT date_trunc('day', created_at) AS day,
                  COALESCE(SUM(characters),0)  AS characters,
                  COALESCE(SUM(credits),0)     AS credits
             FROM usage_events
            WHERE user_id = $1 AND created_at > now() - ($2 || ' days')::interval
            GROUP BY 1 ORDER BY 1""",
        user_id,
        str(days),
    )
    return {
        "totals": {k: int(v) for k, v in dict(totals).items()},
        "daily": [
            {"day": r["day"].isoformat(), "characters": int(r["characters"]), "credits": int(r["credits"])}
            for r in daily
        ],
    }


async def history(user_id: int | None, limit: int = 50) -> list[dict]:
    rows = await db.fetch_all(
        """SELECT id, request_id, input_text, spoken_text, voice, gender, age, style,
                  audio_format, characters, credits, audio_bytes, duration_ms, warnings, created_at
             FROM tts_requests WHERE user_id IS NOT DISTINCT FROM $1
            ORDER BY created_at DESC LIMIT $2""",
        user_id,
        limit,
    )
    out = []
    for r in rows:
        item = dict(r)
        item["created_at"] = item["created_at"].isoformat()
        out.append(item)
    return out


def signing_secret() -> bytes:
    return os.getenv("SESSION_SECRET", "dev-only-insecure-secret").encode("utf-8")
