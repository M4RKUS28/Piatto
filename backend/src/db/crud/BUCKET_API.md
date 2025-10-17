# Bucket Storage API

## 📁 Dateistruktur

```text
users/<user_id>/<category>/<DD-MM-YYYY>/<uuid>.<ext>
```

**Beispiel:** `users/123/recipes/17-10-2025/a3f2e8d9.pdf`

## 📋 Response Format

Alle Funktionen geben einheitliche Objekte zurück:

```json
{
  "key": "users/123/recipes/17-10-2025/a3f2e8d9.pdf",
  "original_filename": "mein_rezept.pdf",
  "content_type": "application/pdf",
  "size": 1024567,
  "category": "recipes",
  "uploaded_at": "2025-10-17T12:34:56Z",
  "status": "uploaded"
}
```

## 🔌 REST API Endpoints

### Upload File

```http
POST /api/files/upload?user_id=<id>&category=<cat>
Content-Type: multipart/form-data

file: <binary>
```

**Response:** File-Info mit generiertem `key`

### Get File Info

```http
GET /api/files/info/<key:path>
```

### List Files

```http
GET /api/files/list?user_id=<id>&category=<cat>&date_prefix=<date>
```

**Filter:**
- `category` - z.B. "recipes", "images"
- `date_prefix` - z.B. "17-10-2025" oder "10-2025"

### Check Exists

```http
GET /api/files/exists/<key:path>
```

### Generate Signed Download URL

```http
POST /api/files/signed-url?key=<key>&minutes=60
```

**Response:** File-Info + `signed_url` (temp. Download-Link)

### Generate Signed Upload URL

```http
POST /api/files/signed-put?user_id=<id>&category=<cat>&filename=<name>&content_type=<mime>
```

**Response:** File-Info + `signed_url` (für direkten Client-Upload via PUT)

⚠️ **Wichtig:** Client muss den `key` aus der Response speichern!

### Make Public

```http
POST /api/files/public-url?key=<key>
```

**Response:** File-Info + `public_url` (permanent öffentlich)

### Delete File

```http
DELETE /api/files/<key:path>
```

## 🔒 Sicherheit

- ✅ UUID-basierte Keys (keine Kollisionen)
- ✅ Server-seitige Key-Generierung (keine Path-Traversal)
- ✅ MIME-Type Validation (nur erlaubte Typen)
- ✅ Size Limits (max 50 MB)
- ✅ Originalname sicher in Metadata

## 🐍 Python Functions

```python
from db.crud.bucket_base_repo import *

# Upload
file_info = await upload_file(sess, user_id, category, tmp_path, filename, content_type)

# List
files = await list_files(sess, user_id, category="recipes", date_prefix="17-10-2025")

# Get Info
info = await get_file_info(sess, key)

# Signed URL
url_info = await generate_signed_get_url(sess, key, minutes=60)

# Delete
deleted_info = await delete_file(sess, key)
```
