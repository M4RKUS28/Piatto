# Piatto Architecture Overview (2025-10-18)

This document summarizes the current production architecture, traffic flow, and CI/CD for the Piatto application.

## High-level Flow

Client → HTTPS → Global External HTTP(S) Load Balancer → Routing:

1) /api/* → Cloud Run (FastAPI backend)
   → Docker (Uvicorn workers) → FastAPI → Cloud SQL (MySQL) + Cloud Storage (as needed)

2) /assets/*, /index.html, logo assets → Cloud CDN → Cloud Storage Backend Bucket
   → GCS bucket: static-web-piatto (served via backend bucket "frontend-bucket")

3) All other paths → Cloud CDN → Cloud Run Frontend Service (Nginx)
   → Docker (Nginx) → try_files for SPA routing (fallback to /index.html)

## Components

- Domains: `piatto-cooks.com`, `www.piatto-cooks.com`
- Project: cloud-run-hackathon-475303
- Region: us-central1
- Global IP: piatto-web-ip (A records → 34.8.45.221)
- Managed Cert: piatto-managed-cert (covers both hostnames)
- URL Map: piatto-url-map
- Backend Bucket: frontend-bucket → gs://static-web-piatto (CDN enabled)
- Backend Service (API): fastapi-backend-service → serverless NEG "fastapi-neg" → Cloud Run service "fastapi-backend"
- Backend Service (Frontend): piatto-frontend-service → serverless NEG "piatto-frontend-neg" → Cloud Run service "piatto-frontend" (Nginx)

## Routing Rules (current)

- Default: piatto-frontend-service (Nginx SPA via Cloud Run)
- Path rules:
  - /api/* → fastapi-backend-service
  - /assets/*, /index.html, /logo_full_name.svg, /logo_no_P.svg, /logo_P.svg, /logo_P_test.png → frontend-bucket

These rules are stored as code in `piatto-url-map.yaml` and imported via gcloud.

## Frontend Nginx Behavior

- location /assets → Cache-Control: public, max-age=31536000, immutable
- location / → try_files $uri $uri/ /index.html
- location = /index.html → Cache-Control: no-cache (always revalidate)

This ensures SPA client-side routing works and users always get the latest shell.

## CI/CD

- Backend (prod): `.github/workflows/prod-backend-docker.yml`
  - Build → Artifact Registry: us-central1-docker.pkg.dev/.../backend-repo/backend:prod-${GITHUB_SHA}
  - Deploy → Cloud Run service: fastapi-backend

- Frontend (prod): `.github/workflows/prod-frontend-docker.yml`
  - Build → Artifact Registry: us-central1-docker.pkg.dev/.../frontend-repo/frontend:prod-${GITHUB_SHA}
  - Deploy → Cloud Run service: piatto-frontend

Note: Static assets are served from the bucket via CDN; the frontend service handles SPA routes.

## Operational Commands (reference)

- Describe URL map:

```bash
gcloud compute url-maps describe piatto-url-map --format=json --project=cloud-run-hackathon-475303
```

- Import URL map from repo YAML:

```bash
gcloud compute url-maps import piatto-url-map \
  --source=piatto-url-map.yaml \
  --global \
  --project=cloud-run-hackathon-475303
```

- Invalidate CDN cache for bucket-backed paths:

```bash
gcloud compute backend-buckets invalidate-cdn-cache frontend-bucket \
  --path "/assets/*,/index.html,/logo_*.svg,/logo_*.png"
```

- Invalidate CDN cache for frontend service:

```bash
gcloud compute backend-services invalidate-cdn-cache piatto-frontend-service \
  --global \
  --path "/index.html"
```

## ASCII Diagram

```text
[Client]
   |
   v
[Global HTTPS Load Balancer]
   |-- host: piatto-cooks.com, www.piatto-cooks.com
   |
   |-- /api/* --------------------------> [Backend Service: fastapi-backend-service]
   |                                        |-- serverless NEG: fastapi-neg
   |                                        |-- Cloud Run: fastapi-backend
   |                                        |-- Uvicorn → FastAPI → Cloud SQL (MySQL)
   |
   |-- /assets/*, /index.html, logos ----> [Backend Bucket: frontend-bucket] → [Cloud CDN]
   |
   |-- default (SPA routes) --------------> [Frontend Service: piatto-frontend-service] → [Cloud CDN]
                                            |-- serverless NEG: piatto-frontend-neg
                                            |-- Cloud Run: piatto-frontend (Nginx)
                                            |-- try_files → /index.html
```
