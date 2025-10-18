import os
import time
import logging
import asyncio
from dataclasses import dataclass
from typing import Optional, Callable
from contextlib import asynccontextmanager

from google.cloud import storage
from google.auth.credentials import Credentials
from google.api_core import exceptions as gapi_exc

logger = logging.getLogger(__name__)

DEFAULT_MAX_RETRIES = 5
DEFAULT_INITIAL_BACKOFF = 1.0  # seconds
DEFAULT_TIMEOUT = 30.0  # per request

@dataclass(slots=True)
class BucketSession:
    client: storage.Client
    bucket: storage.Bucket
    timeout: float

class BucketEngine:
    """Singleton-ähnliche Engine (wie SQLAlchemy AsyncEngine) für Google Cloud Storage."""

    def __init__(
        self,
        bucket_name: str,
        timeout: float = DEFAULT_TIMEOUT,
        project: Optional[str] = None,
        credentials: Optional[Credentials] = None,
    ) -> None:
        self._bucket_name = bucket_name
        self._timeout = timeout
        self._project = project
        self._credentials = credentials
        self._client: Optional[storage.Client] = None
        self._bucket: Optional[storage.Bucket] = None
        self._lock = asyncio.Lock()

    async def start(self) -> None:
        """Initialisiert Client & Bucket (idempotent)."""
        if self._client and self._bucket:
            return
        async with self._lock:
            if self._client and self._bucket:
                return

            # Lokale Dev mit Keyfile, sonst Metadata/ADC in Cloud Run
            keyfile = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if keyfile:
                logger.info("GCS: using service account keyfile at %s", keyfile)
                self._client = storage.Client.from_service_account_json(keyfile, project=self._project)
            else:
                logger.info("GCS: using Application Default Credentials (Cloud Run)")
                self._client = storage.Client(project=self._project, credentials=self._credentials)

            self._bucket = self._client.bucket(self._bucket_name)
            # leichte Probe
            try:
                await self._run_blocking(lambda: self._bucket.exists(timeout=self._timeout))
                logger.info("✅ GCS bucket '%s' ready", self._bucket_name)
            except Exception as e:
                logger.exception("❌ Failed to access bucket '%s': %s", self._bucket_name, e)
                raise

    def session(self) -> BucketSession:
        assert self._client and self._bucket, "BucketEngine not started. Call await engine.start() first."
        return BucketSession(client=self._client, bucket=self._bucket, timeout=self._timeout)

    # ---------- Retry Helper ----------
    @staticmethod
    async def _retry(
        fn: Callable,
        *args,
        max_retries: int = DEFAULT_MAX_RETRIES,
        initial_backoff: float = DEFAULT_INITIAL_BACKOFF,
        **kwargs,
    ):
        backoff = initial_backoff
        last_exc = None
        for attempt in range(1, max_retries + 1):
            try:
                return await BucketEngine._run_blocking(fn, *args, **kwargs)
            except (gapi_exc.TooManyRequests, gapi_exc.ServiceUnavailable, gapi_exc.InternalServerError, gapi_exc.DeadlineExceeded) as e:
                last_exc = e
                logger.warning("GCS transient error on attempt %d/%d: %s (retrying in %.1fs)", attempt, max_retries, e, backoff)
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 16.0)
            except (gapi_exc.NotFound, gapi_exc.PermissionDenied, gapi_exc.BadRequest) as e:
                # Expected errors - don't retry, don't log as error
                raise e
            except Exception as e:
                last_exc = e
                logger.error("GCS non-retryable error: %s", e)
                break
        raise last_exc

    @staticmethod
    async def _run_blocking(fn: Callable, *args, **kwargs):
        # google-cloud-storage ist sync; in Thread ausführen
        return await asyncio.to_thread(fn, *args, **kwargs)

# Global factory (optional singleton)
_engine: Optional[BucketEngine] = None

async def get_bucket_engine(bucket_name: str = "piatto-bucket") -> BucketEngine:
    global _engine
    if _engine is None:
        _engine = BucketEngine(bucket_name=bucket_name)
        await _engine.start()
    return _engine


# FastAPI Dependency: liefert pro Request eine Session
async def get_bucket_session() -> BucketSession:
    """
    FastAPI Dependency für bucket sessions.
    Verwendung: bucket_session: BucketSession = Depends(get_bucket_session)
    """
    engine = await get_bucket_engine()
    return engine.session()


# Async Context Manager: für manuelle Verwendung außerhalb von FastAPI
@asynccontextmanager
async def get_async_bucket_session():
    """
    Async context manager für bucket sessions.
    Verwendung: async with get_async_bucket_session() as session:
    
    Im Gegensatz zu DB-Sessions gibt es hier kein commit/rollback,
    da GCS-Operationen sofort ausgeführt werden.
    """
    engine = await get_bucket_engine()
    session = engine.session()
    try:
        yield session
    finally:
        # Cleanup falls nötig (aktuell keine Ressourcen zu schließen)
        pass


