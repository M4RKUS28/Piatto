import os
import logging
from datetime import timedelta
from typing import List, Optional

from fastapi import HTTPException
from google.cloud.storage import Blob

from ..db.bucket_session import BucketSession, BucketEngine

logger = logging.getLogger(__name__)

# ------ Policy / Limits ------
MAX_FILE_BYTES = 50 * 1024 * 1024  # 50 MB

ALLOWED_MIME: set[str] = {
    # Images
    "image/jpeg", "image/png", "image/webp",
    # Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

# ------ Helpers ------
def _sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal attacks."""
    # Remove any path components and keep only the filename
    import os.path
    return os.path.basename(filename)

def _user_key(user_id: str, filename: str) -> str:
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    if not filename:
        raise HTTPException(status_code=400, detail="filename is required")
    
    # Sanitize filename to prevent path traversal
    safe_filename = _sanitize_filename(filename)
    if not safe_filename or safe_filename in (".", ".."):
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    return f"users/{user_id}/{safe_filename}"

def _validate_upload_inputs(content_type: Optional[str], file_size: int) -> None:
    if file_size > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large. Max {MAX_FILE_BYTES // (1024*1024)} MB")
    if content_type and content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=415, detail=f"Unsupported MIME type: {content_type}")

# ============================================================
# Public API (funktional, erwartet BucketSession als Parameter)
# ============================================================

async def upload_file(
    sess: BucketSession,
    user_id: str,
    tmp_path: str,
    filename: str,
    content_type: Optional[str],
) -> str:
    """
    Lädt eine Datei aus tmp_path nach gs://<bucket>/users/<user_id>/<filename>.
    Wirft HTTPException bei Fehlern. Gibt den Objekt-Key zurück.
    """
    if not os.path.exists(tmp_path):
        raise HTTPException(status_code=400, detail="Temp file not found")

    try:
        size = os.path.getsize(tmp_path)
    except OSError:
        raise HTTPException(status_code=400, detail="Cannot stat temp file")

    _validate_upload_inputs(content_type, size)

    key = _user_key(user_id, filename)
    blob: Blob = sess.bucket.blob(key)

    logger.info("GCS upload -> gs://%s/%s (%d bytes, %s)", sess.bucket.name, key, size, content_type)

    try:
        await BucketEngine._retry(
            blob.upload_from_filename,
            tmp_path,
            content_type=content_type,
            timeout=sess.timeout,
        )
    except Exception as e:
        logger.exception("Upload failed for gs://%s/%s: %s", sess.bucket.name, key, e)
        raise HTTPException(status_code=500, detail="Upload failed") from e

    return key


async def make_file_public(sess: BucketSession, user_id: str, filename: str) -> str:
    """
    Setzt die Datei öffentlich und gibt die öffentliche URL zurück.
    """
    key = _user_key(user_id, filename)
    blob = sess.bucket.blob(key)

    exists = await BucketEngine._retry(blob.exists, timeout=sess.timeout)
    if not exists:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        await BucketEngine._retry(blob.make_public, timeout=sess.timeout)
    except Exception as e:
        logger.exception("make_public failed for gs://%s/%s: %s", sess.bucket.name, key, e)
        raise HTTPException(status_code=500, detail="Failed to make file public") from e

    # Öffentliche URL (funktioniert nur, wenn blob öffentlich ist)
    return f"https://storage.googleapis.com/{sess.bucket.name}/{key}"


async def generate_signed_get_url(
    sess: BucketSession,
    user_id: str,
    filename: str,
    minutes: int = 60,
) -> str:
    """
    Erzeugt eine v4 signed GET-URL (Standard: 60 Minuten gültig).
    """
    key = _user_key(user_id, filename)
    blob = sess.bucket.blob(key)

    exists = await BucketEngine._retry(blob.exists, timeout=sess.timeout)
    if not exists:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        url = await BucketEngine._retry(
            blob.generate_signed_url,
            version="v4",
            expiration=timedelta(minutes=minutes),
            method="GET",
        )
        return url
    except Exception as e:
        logger.exception("signed GET url failed for gs://%s/%s: %s", sess.bucket.name, key, e)
        raise HTTPException(status_code=500, detail="Failed to generate signed URL") from e


async def generate_signed_put_url(
    sess: BucketSession,
    user_id: str,
    filename: str,
    content_type: str,
    minutes: int = 15,
) -> str:
    """
    Erzeugt eine v4 signed PUT-URL, damit das Frontend direkt zu GCS hochladen kann.
    Wichtig: content_type muss vom Client gesetzt werden (gleicher Wert beim PUT).
    Optional: Content-Length-Limit clientseitig sicherstellen.
    """
    if content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=415, detail=f"Unsupported MIME type: {content_type}")

    key = _user_key(user_id, filename)
    blob = sess.bucket.blob(key)

    try:
        url = await BucketEngine._retry(
            blob.generate_signed_url,
            version="v4",
            expiration=timedelta(minutes=minutes),
            method="PUT",
            content_type=content_type,
        )
        return url
    except Exception as e:
        logger.exception("signed PUT url failed for gs://%s/%s: %s", sess.bucket.name, key, e)
        raise HTTPException(status_code=500, detail="Failed to generate upload URL") from e


async def delete_file(sess: BucketSession, user_id: str, filename: str) -> bool:
    key = _user_key(user_id, filename)
    blob = sess.bucket.blob(key)
    try:
        await BucketEngine._retry(blob.delete, timeout=sess.timeout)
        return True
    except Exception as e:
        logger.warning("Delete failed for gs://%s/%s: %s", sess.bucket.name, key, e)
        return False


async def file_exists(sess: BucketSession, user_id: str, filename: str) -> bool:
    key = _user_key(user_id, filename)
    blob = sess.bucket.blob(key)
    try:
        return await BucketEngine._retry(blob.exists, timeout=sess.timeout)
    except Exception as e:
        logger.exception("Exists check failed for gs://%s/%s: %s", sess.bucket.name, key, e)
        raise HTTPException(status_code=500, detail="Exists check failed") from e


async def list_files(sess: BucketSession, user_id: str, prefix: str = "", max_results: int = 1000) -> List[str]:
    pre = f"users/{user_id}/" + (prefix or "")
    try:
        # list_blobs ist sync-Iterator → in Thread ausführen
        def _list_blobs():
            it = sess.client.list_blobs(sess.bucket, prefix=pre, max_results=max_results)
            return [b.name for b in it]
        
        names: List[str] = await BucketEngine._run_blocking(_list_blobs)
        return names
    except Exception as e:
        logger.exception("List files failed under gs://%s/%s: %s", sess.bucket.name, pre, e)
        raise HTTPException(status_code=500, detail="List files failed") from e
