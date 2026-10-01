"""Smoke test the Neon connection. Credentials come from the environment only."""
import asyncio
import os
import sys

for line in open(os.path.join(os.path.dirname(__file__), ".env"), encoding="utf-8"):
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

sys.path.insert(0, os.path.dirname(__file__))
from database import db  # noqa: E402


async def main():
    print("configured:", db.configured)
    print("health    :", await db.health())
    version = await db.fetch_one("SELECT current_database() AS db, current_user AS usr")
    print("session   :", dict(version) if version else None)
    tables = await db.fetch_all(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' ORDER BY table_name"
    )
    print("tables    :", [t["table_name"] for t in tables] or "(none yet)")
    await db.shutdown()


asyncio.run(main())
