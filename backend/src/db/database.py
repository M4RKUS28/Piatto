import asyncio
import logging
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from urllib.parse import quote_plus

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text
from sqlalchemy.pool import NullPool

from ..config import settings

logger = logging.getLogger(__name__)

engine = None  # Global engine instance

# ✅ Local SQLite fallback
async def _create_local_engine(url: str):
    if url.startswith("sqlite://") and not url.startswith("sqlite+aiosqlite://"):
        url = url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    engine = create_async_engine(
        url,
        poolclass=NullPool,
        connect_args={"check_same_thread": False},
    )
    return engine

# ✅ Retry-enabled MySQL Cloud connection
async def _create_cloud_engine_with_retry(max_retries=5, wait_seconds=2):
    # Build MySQL connection URL safely
    safe_password = quote_plus(settings.DB_PASSWORD)
    mysql_url= (
        f"mysql+aiomysql://{settings.DB_USER}:{safe_password}"
        f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    )
    logger.info(f"Connecting to Cloud SQL: {mysql_url}")

    last_exc = None
    for attempt in range(1, max_retries + 1):
        try:
            engine = create_async_engine(
                mysql_url,
                pool_recycle=settings.DB_POOL_RECYCLE,
                pool_pre_ping=settings.DB_POOL_PRE_PING,
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
                connect_args={"connect_timeout": settings.DB_CONNECT_TIMEOUT},
            )
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            logger.info(f"✅ Cloud SQL connected on attempt {attempt}")
            return engine
        except Exception as e:
            last_exc = e
            logger.warning(f"Retry {attempt}/{max_retries} failed: {e}")
            await asyncio.sleep(wait_seconds)
    raise last_exc

# ✅ Select engine based on DATABASE_URL
async def get_engine():
    global engine
    if engine is None:
        if settings.DATABASE_URL and settings.DATABASE_URL.startswith("sqlite"):
            logger.info("Using LOCAL SQLite database.")
            engine = await _create_local_engine(settings.DATABASE_URL)
        else:
            logger.info("Using Cloud SQL MySQL database.")
            engine = await _create_cloud_engine_with_retry()
    return engine

# ✅ Session factory
async_session_factory = sessionmaker(
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# ✅ FastAPI dependency
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    db_engine = await get_engine()
    async_session_factory.configure(bind=db_engine)
    session = async_session_factory()
    try:
        yield session
    finally:
        await session.close()

Base = declarative_base()

# ✅ Optional: Async context manager
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
