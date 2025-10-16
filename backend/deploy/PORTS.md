# Nexora Port Mapping and Nginx/Compose Overview

This document summarizes the standardized external ports and the Nginx reverse proxy mapping for dev and prod.

## Port scheme

Suffixes (shared across environments):

- App (Nexora API): X000 -> container 8000
- MinIO Console:    X001 -> container 9001
- MinIO API:        X002 -> container 9000 (not always exposed)
- ChromaDB HTTP:    X011 -> container 8000 (not exposed in prod by default)
- pgAdmin UI:       X090 -> container 80

Environment prefixes:

- Local/standard: 80XX
- Dev:            60XX
- Prod:           50XX

## Base compose (local/standard)

File: `backend/docker-compose.yml`

- nexora: 8000:8000
- minio console: 8001:9001
- pgadmin: 8090:80

## Dev overrides

File: `backend/deploy/dev/docker-compose.dev.yml` (ports-only overrides)

- nexora: 6000:8000
- minio console: 6001:9001
- pgadmin: 6090:80

## Prod overrides

File: `backend/deploy/prod/docker-compose.prod.yml` (ports-only overrides)

- nexora: 5000:8000
- minio console: 5001:9001
- pgadmin: 5090:80

## Frontend dev proxy

File: `frontend/vite.config.js`

- /api -> <http://127.0.0.1:8000>

## Notes

- Internal service communication still uses Docker service ports (e.g., `minio:9000`).
- Expose ChromaDB and MinIO API externally only if needed (6011/5011, 6002/5002) for security.
-