import asyncio
import logging
from typing import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

from ..config import settings

logger = logging.getLogger(__name__)

# Build MySQL Async URL
DATABASE_URL = (
    f"mysql+aiomysql://{settings.DB_USER}:{settings.DB_PASSWORD}"
    f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
)

# DEBUG
DATABASE_URL="sqlite:///./test.db"


# Engine placeholder
engine = None

async def _create_engine_with_retry(
    url: str,
    max_retries: int = 5,
    wait_seconds: int = 3,
):
    last_exc = None
    for attempt in range(1, max_retries + 1):
        try:
            _engine = create_async_engine(
                url,
                pool_recycle=settings.DB_POOL_RECYCLE,
                pool_pre_ping=settings.DB_POOL_PRE_PING,
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
                connect_args={"connect_timeout": settings.DB_CONNECT_TIMEOUT},
            )

            async with _engine.connect() as conn:
                await conn.execute(text("SELECT 1"))

            logger.info("✅ DB connected successfully on attempt %s", attempt)
            return _engine

        except Exception as e:
            last_exc = e
            logger.warning(
                "⚠️ DB connection attempt %s/%s failed: %s", attempt, max_retries, str(e)
            )
            if attempt < max_retries:
                logger.info("🔁 Retrying in %s seconds...", wait_seconds)
                await asyncio.sleep(wait_seconds)

    logger.error("❌ Could not connect to database after retries")
    raise last_exc

async def get_engine():
    """Get or create the async database engine."""
    global engine
    if engine is None:
        engine = await _create_engine_with_retry(DATABASE_URL)
    return engine

# Session factory
async_session_factory = sessionmaker(
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
    bind=None,
)

# FastAPI dependency
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides a database session."""
    db_engine = await get_engine()
    async_session_factory.configure(bind=db_engine)
    session: AsyncSession = async_session_factory()
    try:
        yield session
    finally:
        await session.close()

# Declarative Base
Base = declarative_base()

# Async context manager
@asynccontextmanager
async def get_async_db_context():
    """Async context manager for database session."""
    db_engine = await get_engine()
    async_session_factory.configure(bind=db_engine)
    session: AsyncSession = async_session_factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
