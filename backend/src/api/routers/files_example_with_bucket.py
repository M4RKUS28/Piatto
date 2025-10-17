# app/routes/files.py
import os
import tempfile
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException

from ...db.bucket_session import get_bucket_session, BucketSession
from ...db.crud.bucket_base_repo import (
    upload_file, make_file_public, generate_signed_get_url,
    generate_signed_put_url, delete_file, file_exists, list_files,
)



router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload")
async def upload(user_id: str, file: UploadFile = File(...), sess: BucketSession = Depends(get_bucket_session)):
    # tempfile.gettempdir() works cross-platform (Windows: C:\Users\...\AppData\Local\Temp, Linux: /tmp)
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        body = await file.read()
        tmp.write(body)
        tmp.flush()
        tmp_path = tmp.name
    try:
        key = await upload_file(sess, user_id, tmp_path, file.filename, file.content_type)
        return {"status": "ok", "key": key}
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass

@router.get("/public-url")
async def public_url(user_id: str, filename: str, sess: BucketSession = Depends(get_bucket_session)):
    url = await make_file_public(sess, user_id, filename)
    return {"public_url": url}

@router.get("/signed-url")
async def signed_get(user_id: str, filename: str, minutes: int = 60, sess: BucketSession = Depends(get_bucket_session)):
    url = await generate_signed_get_url(sess, user_id, filename, minutes)
    return {"signed_url": url, "expires_min": minutes}

@router.post("/signed-put")
async def signed_put(user_id: str, filename: str, content_type: str, minutes: int = 15, sess: BucketSession = Depends(get_bucket_session)):
    url = await generate_signed_put_url(sess, user_id, filename, content_type, minutes)
    return {"upload_url": url, "method": "PUT", "content_type": content_type, "expires_min": minutes}

@router.get("/exists")
async def exists(user_id: str, filename: str, sess: BucketSession = Depends(get_bucket_session)):
    ok = await file_exists(sess, user_id, filename)
    return {"exists": ok}

@router.get("/list")
async def list_(user_id: str, prefix: str = "", sess: BucketSession = Depends(get_bucket_session)):
    items = await list_files(sess, user_id, prefix)
    return {"files": items}

@router.delete("")
async def delete_(user_id: str, filename: str, sess: BucketSession = Depends(get_bucket_session)):
    ok = await delete_file(sess, user_id, filename)
    if not ok:
        raise HTTPException(status_code=404, detail="File not found or cannot delete")
    return {"deleted": True}



