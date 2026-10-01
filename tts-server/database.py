# Minimal database helpers for Neon/Postgres
# Uses asyncpg only when DATABASE_URL is present. No schema or secrets are committed.
import os
import re
import urllib.parse
from contextlib import asynccontextmanager
from typing import Any

import asyncpg


def _parse_database_url(raw: str) -> dict[str, str | int | None]:
    parsed = urllib.parse.urlparse(raw)
    password = parsed.password
    if password is not None:
        password = urllib.parse.unquote(password)
    return {
        "user": parsed.username,
        "password": password,
        "database": parsed.path.lstrip("/") or None,
        "host": parsed.hostname,
        "port": parsed.port or 5432,
        "ssl": "require",
    }


class Database:
    def __init__(self) -> None:
        self._pool: asyncpg.Pool | None = None

    def _read_url(self) -> str:
        # Read lazily so a .env file loaded after import is still honoured.
        return os.getenv("DATABASE_URL", "").strip()

    @property
    def configured(self) -> bool:
        return bool(self._read_url())

    async def startup(self) -> None:
        url = self._read_url()
        if not url or self._pool is not None:
            return
        self._pool = await asyncpg.create_pool(**_parse_database_url(url))

    async def shutdown(self) -> None:
        if self._pool is None:
            return
        await self._pool.close()
        self._pool = None

    async def health(self) -> dict[str, Any]:
        if not self.configured:
            return {"configured": False, "status": "not_configured"}
        try:
            await self.startup()
            async with self._pool.acquire() as conn:
                version = await conn.fetchval("SELECT version()")
            return {"configured": True, "status": "ok", "version": version}
        except Exception as exc:  # noqa: BLE001
            return {"configured": True, "status": "error", "error": type(exc).__name__}

    async def fetch_one(self, query: str, *args: Any) -> asyncpg.Record | None:
        await self.startup()
        async with self._pool.acquire() as conn:
            return await conn.fetchrow(query, *args)

    async def fetch_all(self, query: str, *args: Any) -> list[asyncpg.Record]:
        await self.startup()
        async with self._pool.acquire() as conn:
            return await conn.fetch(query, *args)

    async def execute(self, query: str, *args: Any) -> str:
        await self.startup()
        async with self._pool.acquire() as conn:
            return await conn.execute(query, *args)

    @asynccontextmanager
    async def transaction(self):
        """Yield a connection inside a transaction, rolling back on error."""
        await self.startup()
        async with self._pool.acquire() as conn:
            async with conn.transaction():
                yield conn

    async def apply_schema(self) -> list[str]:
        """Run schema.sql statement by statement so it works with or without args."""
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        with open(schema_path, encoding="utf-8") as handle:
            body = handle.read()
        body = re.sub(r"^\s*--.*$", "", body, flags=re.M)
        statements = [s.strip() for s in body.split(";") if s.strip()]
        await self.startup()
        applied = []
        async with self._pool.acquire() as conn:
            async with conn.transaction():
                for statement in statements:
                    await conn.execute(statement)
                    applied.append(statement.split("(")[0].strip())
        return applied


db = Database()

