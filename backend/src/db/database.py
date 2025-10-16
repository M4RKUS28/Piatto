"""
Database connection and session management with retry logic.
"""
from contextlib import contextmanager
from typing import Iterator
import time
import logging

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError

from ..config import settings


logger = logging.getLogger(__name__)


# Create engine with retry logic: try to connect up to 5 times, waiting 3 seconds between attempts
def _create_engine_with_retry(url: str, max_retries: int = 5, wait_seconds: int = 3):
    last_exc = None
    for attempt in range(1, max_retries + 1):
        try:
            _engine = create_engine(
                url,
                pool_recycle=settings.DB_POOL_RECYCLE,
                pool_pre_ping=settings.DB_POOL_PRE_PING,
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
                connect_args={"connect_timeout": settings.DB_CONNECT_TIMEOUT},
            )
            # Try a lightweight connect to ensure DB is reachable
            conn = _engine.connect()
            conn.close()
            logger.info("Database connection established on attempt %d", attempt)
            return _engine
        except SQLAlchemyError as e:
            last_exc = e
            logger.warning("Database connection attempt %d/%d failed: %s", attempt, max_retries, str(e))
            if attempt < max_retries:
                logger.info("Retrying in %d seconds...", wait_seconds)
                time.sleep(wait_seconds)

    # All retries failed
    logger.error("Could not connect to the database after %d attempts", max_retries)
    raise last_exc


engine = _create_engine_with_retry(settings.SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_context():
    """Context manager to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_context_with_rollback() -> Iterator[Session]:
    """Context manager to get a database session with rollback on exception."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

