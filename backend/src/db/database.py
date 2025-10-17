import asyncio
import logging
from typing import Any, AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text

from sqlalchemy.pool import NullPool

from ..config import settings

logger = logging.getLogger(__name__)

DATABASE_URL = settings.DATABASE_URL  # supports mysql or sqlite

# Global engine
engine = None

# -------------------------------
# LOCAL SQLITE FALLBACK ENGINE
# -------------------------------
async def _create_local_engine_with_retry(
    url: str,
    max_retries: int = 3,
    wait_seconds: int = 1,
):
    last_exc = None
    
    # Convert sqlite:// to sqlite+aiosqlite:// for async support
    if url.startswith("sqlite://") and not url.startswith("sqlite+aiosqlite://"):
        url = url.replace("sqlite://", "sqlite+aiosqlite://", 1)
        logger.info(f"Converted SQLite URL to use aiosqlite driver: {url}")
    
    for attempt in range(1, max_retries + 1):
        try:
            _engine = create_async_engine(
                url,
                poolclass=NullPool,  # no pooling for sqlite
                connect_args={"check_same_thread": False},
            )
            async with _engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            logger.info(f"✅ Local SQLite DB connected on attempt {attempt}")
            return _engine
        except Exception as e:
            last_exc = e
            logger.warning(
                f"⚠️ Local DB connection attempt {attempt}/{max_retries} failed: {e}"
            )
            await asyncio.sleep(wait_seconds)
    raise last_exc


# -------------------------------
# CLOUD SQL MYSQL ENGINE
# -------------------------------
async def _create_cloud_engine_with_retry(
    max_retries: int = 5,
    wait_seconds: int = 3,
):
    last_exc = None
    for attempt in range(1, max_retries + 1):
        try:
            _engine = create_async_engine(
                "mysql+aiomysql://",
                username=settings.DB_USER,
                password=settings.DB_PASSWORD,
                host=settings.DB_HOST,
                port=int(settings.DB_PORT),
                database=settings.DB_NAME,
                pool_recycle=settings.DB_POOL_RECYCLE,
                pool_pre_ping=settings.DB_POOL_PRE_PING,
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
                connect_args={"connect_timeout": settings.DB_CONNECT_TIMEOUT},
            )
            async with _engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            logger.info(f"✅ Cloud SQL DB connected on attempt {attempt}")
            return _engine
        except Exception as e:
            last_exc = e
            logger.warning(
                f"⚠️ Cloud DB connection attempt {attempt}/{max_retries} failed: {e}"
            )
            await asyncio.sleep(wait_seconds)
    raise last_exc


# -------------------------------
# ENGINE SELECTOR
# -------------------------------
async def get_engine():
    global engine
    if engine is None:
        logger.info("Initializing database engine with URL: %s", DATABASE_URL)
        if DATABASE_URL.startswith("sqlite"):
            logger.info("Using local SQLite database.")
            engine = await _create_local_engine_with_retry(DATABASE_URL)
        else:
            logger.info("Using Cloud SQL MySQL database.")
            engine = await _create_cloud_engine_with_retry()
    return engine


# -------------------------------
# SESSION FACTORY
# -------------------------------
async_session_factory = sessionmaker(
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    db_engine = await get_engine()
    async_session_factory.configure(bind=db_engine)
    session = async_session_factory()
    try:
        yield session
    finally:
        await session.close()

# Base model for SQLAlchemy
Base = declarative_base()

# Optional context manager
@asynccontextmanager
async def get_async_db_context():
    db_engine = await get_engine()
    async_session_factory.configure(bind=db_engine)
    session = async_session_factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
