# Optional: expose database health. Does nothing if DATABASE_URL is not set.
from contextlib import asynccontextmanager

from fastapi import FastAPI

from database import db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.startup()
    try:
        yield
    finally:
        await db.shutdown()


def attach_db(app: FastAPI) -> None:
    @app.get("/db/health")
    async def db_health():
        return await db.health()
