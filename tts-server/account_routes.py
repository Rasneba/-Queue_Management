"""Auth, credits, API keys, usage and history endpoints.

Every route is optional: if DATABASE_URL is not configured the endpoints report
that the database is unavailable instead of failing the whole service.
"""
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

import account
from database import db

router = APIRouter()


def _require_db() -> None:
    if not db.configured:
        raise HTTPException(
            status_code=503,
            detail="Database is not configured. Set DATABASE_URL to enable accounts.",
        )


def _bearer(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Expected 'Authorization: Bearer <token>'")
    return token.strip()


async def current_user(authorization: str | None, x_api_key: str | None) -> dict | None:
    _require_db()
    if x_api_key:
        user = await account.resolve_api_key(x_api_key.strip())
        if not user:
            raise HTTPException(status_code=401, detail="Unknown or revoked API key")
        return user
    if authorization:
        user = await account.resolve_session(_bearer(authorization))
        if not user:
            raise HTTPException(status_code=401, detail="Session expired or revoked")
        return user
    return None


async def required_user(authorization: str | None, x_api_key: str | None) -> dict:
    user = await current_user(authorization, x_api_key)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


class RegisterBody(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=8)
    name: str = ""


class LoginBody(BaseModel):
    email: str
    password: str


class KeyBody(BaseModel):
    name: str = "default"


@router.post("/auth/register")
async def register(body: RegisterBody):
    _require_db()
    try:
        user = await account.create_user(body.email, body.name, body.password)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    token = await account.issue_session(user["id"])
    return {"token": token, "user": user}


@router.post("/auth/login")
async def login(body: LoginBody):
    _require_db()
    user = await account.authenticate(body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = await account.issue_session(user["id"])
    return {"token": token, "user": user}


@router.post("/auth/logout")
async def logout(authorization: str | None = Header(default=None)):
    _require_db()
    await account.revoke_session(_bearer(authorization))
    return {"ok": True}


@router.get("/me")
async def me(authorization: str | None = Header(default=None), x_api_key: str | None = Header(default=None)):
    return {"user": await required_user(authorization, x_api_key)}


@router.get("/credits")
async def credits(authorization: str | None = Header(default=None), x_api_key: str | None = Header(default=None)):
    user = await required_user(authorization, x_api_key)
    ledger = await db.fetch_all(
        """SELECT delta, reason, balance_after, created_at
             FROM credit_ledger WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20""",
        user["id"],
    )
    return {
        "balance": user["credits_balance"],
        "per_character": account.CREDITS_PER_CHARACTER,
        "ledger": [
            {
                "delta": r["delta"],
                "reason": r["reason"],
                "balance_after": r["balance_after"],
                "created_at": r["created_at"].isoformat(),
            }
            for r in ledger
        ],
    }


@router.get("/usage")
async def usage(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
    days: int = 30,
):
    user = await required_user(authorization, x_api_key)
    return await account.usage_summary(user["id"], days)


@router.get("/history")
async def history(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
    limit: int = 50,
):
    user = await required_user(authorization, x_api_key)
    return {"items": await account.history(user["id"], min(limit, 200))}


@router.get("/keys")
async def list_keys(authorization: str | None = Header(default=None), x_api_key: str | None = Header(default=None)):
    user = await required_user(authorization, x_api_key)
    return {"items": await account.list_api_keys(user["id"])}


@router.post("/keys")
async def create_key(
    body: KeyBody,
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
):
    user = await required_user(authorization, x_api_key)
    return await account.create_api_key(user["id"], body.name)


@router.delete("/keys/{key_id}")
async def revoke_key(
    key_id: int,
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
):
    user = await required_user(authorization, x_api_key)
    if not await account.revoke_api_key(user["id"], key_id):
        raise HTTPException(status_code=404, detail="Key not found or already revoked")
    return {"ok": True}
