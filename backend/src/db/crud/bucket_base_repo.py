import os
import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from fastapi import HTTPException
from google.cloud.storage import Blob

from ..bucket_session import BucketSession, BucketEngine

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
def _generate_storage_key(user_id: str, category: str, original_filename: str) -> str:
    """
    Generiert einen eindeutigen Storage-Key:
    users/<user_id>/<category>/<day-month-year>/<random_uuid>.<extension>
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    if not category:
        raise HTTPException(status_code=400, detail="category is required")
    if not original_filename:
        raise HTTPException(status_code=400, detail="filename is required")
    
    # Datum: DD-MM-YYYY
    date_str = datetime.utcnow().strftime("%d-%m-%Y")
    
    # Extension extrahieren
    _, ext = os.path.splitext(original_filename)
    if not ext:
        ext = ".bin"  # Fallback für Dateien ohne Extension
    
    # Eindeutige ID generieren
    unique_id = uuid.uuid4().hex
    
    return f"users/{user_id}/{category}/{date_str}/{unique_id}{ext}"


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
    category: str,
    tmp_path: str,
    original_filename: str,
    content_type: Optional[str],
) -> Dict[str, Any]:
    """
    Lädt eine Datei hoch und speichert sie mit generiertem Key.
    
    Returns:
        Dict mit:
        - key: Storage-Key (UUID-basiert)
        - original_filename: Originaler Dateiname
        - content_type: MIME-Type
        - size: Dateigröße in Bytes
        - category: Kategorie
        - uploaded_at: ISO-Timestamp
    """
    if not os.path.exists(tmp_path):
        raise HTTPException(status_code=400, detail="Temp file not found")

    try:
        size = os.path.getsize(tmp_path)
    except OSError:
        raise HTTPException(status_code=400, detail="Cannot stat temp file")

    _validate_upload_inputs(content_type, size)

    # Generiere eindeutigen Key
    key = _generate_storage_key(user_id, category, original_filename)
    blob: Blob = sess.bucket.blob(key)

    # Metadata setzen
    blob.metadata = {
        "original_filename": original_filename,
        "category": category,
        "uploaded_at": datetime.utcnow().isoformat(),
    }

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

    return {
        "key": key,
        "original_filename": original_filename,
        "content_type": content_type,
        "size": size,
        "category": category,
        "uploaded_at": blob.metadata["uploaded_at"],
        "status": "uploaded",
    }


async def get_file_info(sess: BucketSession, key: str) -> Dict[str, Any]:
    """
    Holt File-Informationen inkl. Metadata.
    """
    from google.api_core import exceptions as gapi_exc
    
    blob = sess.bucket.blob(key)
    
    try:
        # Blob neu laden um Metadata zu holen
        await BucketEngine._retry(blob.reload, timeout=sess.timeout)
    except gapi_exc.NotFound:
        # Expected: File doesn't exist - no error log
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        logger.error("Failed to get file info for gs://%s/%s: %s", sess.bucket.name, key, e)
        raise HTTPException(status_code=500, detail="Failed to get file info") from e
    
    return {
        "key": key,
        "original_filename": blob.metadata.get("original_filename", "unknown") if blob.metadata else "unknown",
        "content_type": blob.content_type,
        "size": blob.size,
        "category": blob.metadata.get("category", "uncategorized") if blob.metadata else "uncategorized",
        "uploaded_at": blob.metadata.get("uploaded_at") if blob.metadata else None,
        "public_url": blob.public_url if blob.public_url else None,
        "status": "exists",
    }


async def make_file_public(sess: BucketSession, key: str) -> Dict[str, Any]:
    """
    Setzt die einzelne Datei öffentlich (Fine-grained ACL).
    Der Bucket selbst bleibt privat, nur diese Datei wird für allUsers lesbar.
    """
    from google.api_core import exceptions as gapi_exc
    
    blob = sess.bucket.blob(key)

    try:
        exists = await BucketEngine._retry(blob.exists, timeout=sess.timeout)
    except Exception as e:
        logger.error("Failed to check file existence for gs://%s/%s: %s", sess.bucket.name, key, e)
        raise HTTPException(status_code=500, detail="Failed to check file existence") from e
        
    if not exists:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        # Setze ACL für diese Datei auf public-read
        await BucketEngine._retry(blob.make_public, timeout=sess.timeout)
        logger.info("File made public: gs://%s/%s", sess.bucket.name, key)
    except gapi_exc.BadRequest as e:
        # z.B. Uniform Bucket-Level Access enabled
        logger.warning("Cannot make file public (probably uniform bucket-level access): %s", e)
        raise HTTPException(status_code=400, detail="Cannot make file public. Check bucket access settings.") from e
    except Exception as e:
        logger.error("make_public failed for gs://%s/%s: %s", sess.bucket.name, key, e)
        raise HTTPException(status_code=500, detail="Failed to make file public") from e

    # Metadata laden
    file_info = await get_file_info(sess, key)
    
    # Public URL generieren
    file_info["public_url"] = f"https://storage.googleapis.com/{sess.bucket.name}/{key}"
    file_info["status"] = "public"
    
    return file_info


async def generate_signed_get_url(
    sess: BucketSession,
    key: str,
    minutes: int = 60,
) -> Dict[str, Any]:
    """
    Erzeugt eine v4 signed GET-URL (Standard: 60 Minuten gültig).
    """
    from google.api_core import exceptions as gapi_exc
    
    blob = sess.bucket.blob(key)

    try:
        exists = await BucketEngine._retry(blob.exists, timeout=sess.timeout)
    except Exception as e:
        logger.error("Failed to check file existence for gs://%s/%s: %s", sess.bucket.name, key, e)
        raise HTTPException(status_code=500, detail="Failed to check file existence") from e
        
    if not exists:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        url = await BucketEngine._retry(
            blob.generate_signed_url,
            version="v4",
            expiration=timedelta(minutes=minutes),
            method="GET",
        )
        
        file_info = await get_file_info(sess, key)
        file_info["signed_url"] = url
        file_info["expires_in_minutes"] = minutes
        file_info["status"] = "signed_url_generated"
        
        return file_info
    except Exception as e:
        logger.error("signed GET url failed for gs://%s/%s: %s", sess.bucket.name, key, e)
        raise HTTPException(status_code=500, detail="Failed to generate signed URL") from e


async def generate_signed_put_url(
    sess: BucketSession,
    user_id: str,
    category: str,
    original_filename: str,
    content_type: str,
    minutes: int = 15,
) -> Dict[str, Any]:
    """
    Erzeugt eine v4 signed PUT-URL, damit das Frontend direkt zu GCS hochladen kann.
    
    WICHTIG: Client muss beim PUT die Headers setzen:
    - Content-Type: <gleicher content_type wie hier>
    - x-goog-meta-original_filename: <original_filename>
    - x-goog-meta-category: <category>
    - x-goog-meta-uploaded_at: <timestamp>
    
    Returns:
        Dict mit key, signed_url, headers (die der Client setzen muss)
    """
    if content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=415, detail=f"Unsupported MIME type: {content_type}")

    # Generiere Key vorab
    key = _generate_storage_key(user_id, category, original_filename)
    blob = sess.bucket.blob(key)
    
    # Metadata für den Client (muss als x-goog-meta-* Header gesetzt werden)
    uploaded_at = datetime.utcnow().isoformat()

    try:
        url = await BucketEngine._retry(
            blob.generate_signed_url,
            version="v4",
            expiration=timedelta(minutes=minutes),
            method="PUT",
            content_type=content_type,
        )
        
        return {
            "key": key,
            "signed_url": url,
            "method": "PUT",
            "content_type": content_type,
            "expires_in_minutes": minutes,
            "original_filename": original_filename,
            "category": category,
            "uploaded_at": uploaded_at,
            # Headers die der Client beim PUT setzen MUSS
            "required_headers": {
                "Content-Type": content_type,
                "x-goog-meta-original_filename": original_filename,
                "x-goog-meta-category": category,
                "x-goog-meta-uploaded_at": uploaded_at,
            },
            "status": "upload_url_generated",
        }
    except Exception as e:
        logger.error("signed PUT url failed for gs://%s/%s: %s", sess.bucket.name, key, e)
        raise HTTPException(status_code=500, detail="Failed to generate upload URL") from e


async def delete_file(sess: BucketSession, key: str) -> Dict[str, Any]:
    """
    Löscht eine Datei anhand des Keys.
    """
    from google.api_core import exceptions as gapi_exc
    
    blob = sess.bucket.blob(key)
    try:
        # Hole Info vor dem Löschen (wirft 404 wenn nicht existent)
        file_info = await get_file_info(sess, key)
        
        await BucketEngine._retry(blob.delete, timeout=sess.timeout)
        
        file_info["status"] = "deleted"
        return file_info
    except HTTPException:
        # 404 from get_file_info - re-raise
        raise
    except gapi_exc.NotFound:
        # File already deleted
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        logger.error("Delete failed for gs://%s/%s: %s", sess.bucket.name, key, e)
        raise HTTPException(status_code=500, detail="Delete failed") from e


async def file_exists(sess: BucketSession, key: str) -> Dict[str, Any]:
    """
    Prüft ob Datei existiert und gibt Info zurück.
    """
    blob = sess.bucket.blob(key)
    try:
        exists = await BucketEngine._retry(blob.exists, timeout=sess.timeout)
        
        if exists:
            return await get_file_info(sess, key)
        else:
            return {
                "key": key,
                "exists": False,
                "status": "not_found",
            }
    except Exception as e:
        logger.error("Exists check failed for gs://%s/%s: %s", sess.bucket.name, key, e)
        raise HTTPException(status_code=500, detail="Exists check failed") from e


async def list_files(
    sess: BucketSession, 
    user_id: str, 
    category: Optional[str] = None,
    date_prefix: Optional[str] = None,
    max_results: int = 1000
) -> List[Dict[str, Any]]:
    """
    Listet Dateien eines Users auf, optional gefiltert nach Kategorie und/oder Datum.
    
    Args:
        user_id: User ID
        category: Optional - filtert nach Kategorie (z.B. "recipes", "images")
        date_prefix: Optional - filtert nach Datum-Prefix (z.B. "01-10-2025" oder "01-10")
        max_results: Max. Anzahl Ergebnisse
        
    Returns:
        Liste von File-Info Dicts
    """
    # Prefix aufbauen
    if category and date_prefix:
        pre = f"users/{user_id}/{category}/{date_prefix}"
    elif category:
        pre = f"users/{user_id}/{category}/"
    else:
        pre = f"users/{user_id}/"
    
    try:
        # list_blobs ist sync-Iterator → in Thread ausführen
        def _list_blobs():
            blobs = sess.client.list_blobs(sess.bucket, prefix=pre, max_results=max_results)
            result = []
            for b in blobs:
                result.append({
                    "key": b.name,
                    "original_filename": b.metadata.get("original_filename", "unknown") if b.metadata else "unknown",
                    "content_type": b.content_type,
                    "size": b.size,
                    "category": b.metadata.get("category", "uncategorized") if b.metadata else "uncategorized",
                    "uploaded_at": b.metadata.get("uploaded_at") if b.metadata else None,
                    "status": "exists",
                })
            return result
        
        files = await BucketEngine._run_blocking(_list_blobs)
        return files
    except Exception as e:
        logger.error("List files failed under gs://%s/%s: %s", sess.bucket.name, pre, e)
        raise HTTPException(status_code=500, detail="List files failed") from e
