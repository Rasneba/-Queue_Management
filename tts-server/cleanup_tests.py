"""Remove test accounts and print a row count per table."""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv  # noqa: E402

load_dotenv()
from database import db  # noqa: E402


async def main():
    print("deleted users:", await db.execute("DELETE FROM users WHERE email LIKE 't-%@example.com' OR email LIKE 'rt-%@example.com' OR email LIKE 'lt-%@example.com' OR email LIKE 'ct-%@example.com'"))
    # tts_requests keeps rows after user deletion (ON DELETE SET NULL), so clear
    # the synthesised test audio history as well.
    print("deleted history:", await db.execute("DELETE FROM tts_requests"))
    # Signup ledger rows and sessions reference users, but reset any orphans.
    print("deleted ledger :", await db.execute("DELETE FROM credit_ledger WHERE user_id IS NULL"))
    print("deleted sessions:", await db.execute("DELETE FROM sessions WHERE user_id IS NULL"))
    tables = await db.fetch_all(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    )
    for t in tables:
        count = await db.fetch_one(f'SELECT count(*) AS n FROM "{t["table_name"]}"')
        print(f"  {t['table_name']:<16} {count['n']}")
    await db.shutdown()


asyncio.run(main())

