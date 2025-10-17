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

### Upload File (via Backend)

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

### Generate Signed Download URL (Read-Only, Temporär)

```http
POST /api/files/signed-url?key=<key>&minutes=60
```

**Response:** File-Info + `signed_url` (temporärer Download-Link, läuft ab)

**Use Cases:**
- Private Dateien temporär teilen (z.B. per E-Mail)
- Download-Links mit Ablaufdatum
- Datei bleibt privat, nur URL-Besitzer kann downloaden

### Generate Signed Upload URL (Direkter Client-Upload)

```http
POST /api/files/signed-put?user_id=<id>&category=<cat>&filename=<name>&content_type=<mime>
```

**Response:**

```json
{
  "key": "users/123/recipes/17-10-2025/abc.pdf",
  "signed_url": "https://storage.googleapis.com/...",
  "method": "PUT",
  "required_headers": {
    "Content-Type": "application/pdf",
    "x-goog-meta-original_filename": "mein_rezept.pdf",
    "x-goog-meta-category": "recipes",
    "x-goog-meta-uploaded_at": "2025-10-17T12:34:56Z"
  },
  "expires_in_minutes": 15
}
```

**Client-Implementierung:**

```javascript
// 1. Signed URL vom Backend holen
const uploadInfo = await fetch('/api/files/signed-put?user_id=123&category=recipes&filename=rezept.pdf&content_type=application/pdf', {
  method: 'POST'
}).then(r => r.json());

// 2. Datei direkt zu GCS hochladen (OHNE Backend)
await fetch(uploadInfo.signed_url, {
  method: 'PUT',
  headers: uploadInfo.required_headers,  // ✅ WICHTIG!
  body: fileBlob
});

// 3. Key in eigener DB speichern
await saveToDatabase({ 
  fileKey: uploadInfo.key,
  originalName: uploadInfo.original_filename 
});
```

⚠️ **Wichtig:**
- Client **MUSS** alle `required_headers` setzen (inkl. Metadata)
- `key` aus Response in DB speichern für späteren Zugriff
- URL läuft nach 15 Min ab

### Make Public (Permanent Read-Only)

```http
POST /api/files/public-url?key=<key>
```

**Response:** File-Info + `public_url` (permanent öffentlich)

**Use Cases:**
- Öffentliche Rezeptbilder
- Dauerhaft zugängliche Dateien
- Keine Auth nötig

### Delete File

```http
DELETE /api/files/<key:path>
```

## 🔐 Access Control

### 1. **Privat (Standard nach Upload)**
- Nur via Backend mit Auth
- Oder via Signed URLs (temporär)

### 2. **Public (via make_file_public)**
- ✅ Permanent Read-Only für alle
- ❌ Kein Write-Access
- Bucket bleibt privat (nur einzelne Datei public)

### 3. **Signed URLs (via generate_signed_get_url)**
- ✅ Temporär Read-Only
- ✅ Datei bleibt privat
- ⏱️ Läuft ab nach X Minuten

## 🔒 Sicherheit

- ✅ UUID-basierte Keys (keine Kollisionen)
- ✅ Server-seitige Key-Generierung (keine Path-Traversal)
- ✅ MIME-Type Validation (nur erlaubte Typen)
- ✅ Size Limits (max 50 MB)
- ✅ Originalname sicher in Metadata
- ✅ Fine-grained ACL (per-file Kontrolle)

## 🐍 Python Functions

```python
from db.crud.bucket_base_repo import *

# Upload via Backend
file_info = await upload_file(sess, user_id, category, tmp_path, filename, content_type)

# Signed Upload URL für Client
signed_put = await generate_signed_put_url(sess, user_id, category, filename, content_type)
# → Client macht PUT direkt zu GCS

# List Files
files = await list_files(sess, user_id, category="recipes", date_prefix="17-10-2025")

# Get Info
info = await get_file_info(sess, key)

# Temporärer Download-Link
signed_get = await generate_signed_get_url(sess, key, minutes=60)

# Permanent Public
public_info = await make_file_public(sess, key)

# Delete
deleted_info = await delete_file(sess, key)
```
