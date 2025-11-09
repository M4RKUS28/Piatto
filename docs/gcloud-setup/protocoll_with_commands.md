# Cloud CDN & Load Balancer Setup Protocol (2025-10-18)

This document records the successful end-to-end setup of Google Cloud Storage hosting, Cloud CDN, and a global external HTTP(S) load balancer that fronts both the static web app and the Cloud Run backend.

## Context

- **Project:** `cloud-run-hackathon-475303`
- **Region:** `us-central1`
- **Frontend bucket:** `static-web-piatto`
- **Cloud Run service:** `fastapi-backend`
- **Domains:** `piatto-cooks.com`, `www.piatto-cooks.com`

## 1. Cloud Storage Frontend Bucket

1. Set the active project:

   ```bash
   gcloud config set project cloud-run-hackathon-475303
   ```

2. Create the web bucket with uniform access in `us-central1`:

   ```bash
   gcloud storage buckets create gs://static-web-piatto --location=us-central1 --uniform-bucket-level-access
   ```

3. Configure default website documents:

   ```bash
   gcloud storage buckets update gs://static-web-piatto --web-main-page-suffix=index.html --web-error-page=404.html
   ```

4. Create a dedicated deploy service account:

   ```bash
   gcloud iam service-accounts create frontend-deployer --display-name="Frontend Deployer GitHub Actions"
   ```

5. Grant upload permissions on the bucket:

   ```bash
   gcloud storage buckets add-iam-policy-binding gs://static-web-piatto \
     --member=serviceAccount:frontend-deployer@cloud-run-hackathon-475303.iam.gserviceaccount.com \
     --role=roles/storage.objectAdmin
   ```

6. Generate a JSON key for GitHub Actions (stored as `GCP_CLOUD_STORAGE_SA` secret):

   ```bash
   gcloud iam service-accounts keys create frontend-deployer-key.json \
     --iam-account=frontend-deployer@cloud-run-hackathon-475303.iam.gserviceaccount.com
   ```

7. Allow public read access for website assets:

   ```bash
   gcloud storage buckets add-iam-policy-binding gs://static-web-piatto \
     --member=allUsers \
     --role=roles/storage.objectViewer
   ```

## 2. CDN-Enabled Backend Bucket

1. Enable Cloud CDN by wrapping the bucket in a backend bucket resource:

    ```bash
    gcloud compute backend-buckets create frontend-bucket \
       --gcs-bucket-name=static-web-piatto \
       --enable-cdn \
       --cache-mode=USE_ORIGIN_HEADERS
    ```

    The `USE_ORIGIN_HEADERS` mode ensures the `Cache-Control` metadata set on objects controls caching behaviour.

## 3. HTTPS Load Balancer (Frontend + API Routing)

1. Reserve a global IPv4 address for the load balancer:

    ```bash
    gcloud compute addresses create piatto-web-ip --ip-version=IPV4 --global
    ```

    Retrieve the value for DNS (result: `34.8.45.221`):

    ```bash
    gcloud compute addresses describe piatto-web-ip --global --format='get(address)'
    ```

2. Provision a managed certificate covering both hostnames:

    ```bash
    gcloud compute ssl-certificates create piatto-managed-cert \
       --domains=piatto-cooks.com,www.piatto-cooks.com
    ```

3. Expose the Cloud Run backend via a serverless NEG:

    ```bash
    gcloud compute network-endpoint-groups create fastapi-neg \
       --region=us-central1 \
       --network-endpoint-type=serverless \
       --cloud-run-service=fastapi-backend
    ```

4. Create a backend service and attach the NEG:

    ```bash
    gcloud compute backend-services create fastapi-backend-service \
       --global \
       --load-balancing-scheme=EXTERNAL_MANAGED \
       --protocol=HTTP

    gcloud compute backend-services add-backend fastapi-backend-service \
       --global \
       --network-endpoint-group=fastapi-neg \
       --network-endpoint-group-region=us-central1
    ```

5. Build the URL map: default traffic to the CDN bucket, `/api/*` to Cloud Run.

    ```bash
    gcloud compute url-maps create piatto-url-map --default-backend-bucket=frontend-bucket

    gcloud compute url-maps add-path-matcher piatto-url-map \
       --path-matcher-name=piatto-hosts \
       --default-backend-bucket=frontend-bucket \
       --path-rules='/api/*=fastapi-backend-service'

    gcloud compute url-maps add-host-rule piatto-url-map \
       --hosts=piatto-cooks.com,www.piatto-cooks.com \
       --path-matcher-name=piatto-hosts
    ```

6. Create the HTTPS target proxy and listener on port 443:

    ```bash
    gcloud compute target-https-proxies create piatto-https-proxy \
       --ssl-certificates=piatto-managed-cert \
       --url-map=piatto-url-map

    gcloud compute forwarding-rules create piatto-https-forwarding-rule \
       --address=piatto-web-ip \
       --global \
       --target-https-proxy=piatto-https-proxy \
       --ports=443 \
       --load-balancing-scheme=EXTERNAL_MANAGED
    ```

## 4. HTTP → HTTPS Redirect

1. Define a redirect-only URL map (temporary YAML helper file):

   ```bash
   cat <<'EOF' > piatto-http-redirect.yaml
   name: piatto-http-redirect
   defaultUrlRedirect:
     httpsRedirect: true
     stripQuery: false
   EOF
   ```

2. Import the redirect map and configure HTTP listener:

   ```bash
   gcloud compute url-maps import piatto-http-redirect --source=piatto-http-redirect.yaml --global

   gcloud compute target-http-proxies create piatto-http-proxy --url-map=piatto-http-redirect

   gcloud compute forwarding-rules create piatto-http-forwarding-rule \
     --address=piatto-web-ip \
     --global \
     --target-http-proxy=piatto-http-proxy \
     --ports=80 \
     --load-balancing-scheme=EXTERNAL_MANAGED
   ```

3. Remove the temporary YAML file locally:

   ```bash
   rm piatto-http-redirect.yaml
   ```

## 5. Post-Setup Checklist

- Update DNS A records for `piatto-cooks.com` and `www.piatto-cooks.com` to `34.8.45.221`.
- Wait for the managed certificate to reach `ACTIVE` (confirmed with `gcloud compute ssl-certificates describe piatto-managed-cert`).
- Verify routing:

```bash
curl -I http://piatto-cooks.com            # expects 301 redirect to HTTPS
curl -I https://piatto-cooks.com/          # serves CDN-hosted frontend
curl -I https://piatto-cooks.com/api/health  # reaches Cloud Run backend
```

- When satisfied, store `frontend-deployer-key.json` securely (e.g. GitHub secret) and remove the local copy.

This protocol can be repeated for future environments by substituting project, bucket, service, and domain names as required.

## 6. Frontend via Cloud Run (Nginx) with Artifact Registry

The static SPA is now served by an Nginx-based Cloud Run service fronted by the global HTTP(S) Load Balancer with Cloud CDN.

1) Create Artifact Registry for frontend images (once):

```bash
gcloud artifacts repositories create frontend-repo \
   --repository-format=docker \
   --location=us-central1 \
   --project=cloud-run-hackathon-475303 \
   --description="Docker repository for frontend images"
```

1. Build and deploy the frontend container to Cloud Run (alternative to GitHub Actions):

```bash
# Build & push example
docker build -t us-central1-docker.pkg.dev/cloud-run-hackathon-475303/frontend-repo/frontend:manual ./frontend
docker push us-central1-docker.pkg.dev/cloud-run-hackathon-475303/frontend-repo/frontend:manual

# Deploy to Cloud Run
gcloud run deploy piatto-frontend \
   --image=us-central1-docker.pkg.dev/cloud-run-hackathon-475303/frontend-repo/frontend:manual \
   --region=us-central1 \
   --platform=managed \
   --allow-unauthenticated \
   --cpu=1 --memory=512Mi --min-instances=0 --max-instances=3
```

Note: In production, deployment is automated via GitHub Actions (`.github/workflows/prod-frontend-docker.yml`).

## 7. CDN-enabled Frontend Service behind Load Balancer (Serverless NEG)

Create a serverless NEG for the Cloud Run frontend and attach it to a CDN-enabled backend service.

```bash
# 1) Serverless NEG for Cloud Run frontend
gcloud compute network-endpoint-groups create piatto-frontend-neg \
   --region=us-central1 \
   --network-endpoint-type=serverless \
   --cloud-run-service=piatto-frontend

# 2) Backend service with Cloud CDN enabled
gcloud compute backend-services create piatto-frontend-service \
   --global \
   --load-balancing-scheme=EXTERNAL_MANAGED \
   --protocol=HTTP \
   --enable-cdn

# 3) Attach the NEG to the backend service
gcloud compute backend-services add-backend piatto-frontend-service \
   --global \
   --network-endpoint-group=piatto-frontend-neg \
   --network-endpoint-group-region=us-central1
```

## 8. URL Map Update (API, CDN assets via Bucket, SPA via Frontend)

We updated the URL map to route:

- `/api/*` → `fastapi-backend-service` (Cloud Run backend)
- `/assets/*`, `/index.html`, and specific logo files → `frontend-bucket` (Cloud Storage via Cloud CDN)
- Default (all other paths) → `piatto-frontend-service` (Cloud Run Nginx SPA)

Option A: Set the default service to the frontend service:

```bash
gcloud compute url-maps set-default-service piatto-url-map \
   --default-service=https://www.googleapis.com/compute/v1/projects/cloud-run-hackathon-475303/global/backendServices/piatto-frontend-service
```

Option B: Manage the full URL map via YAML (stored in repo as `piatto-url-map.yaml`) and import:

```yaml
name: piatto-url-map
defaultService: https://www.googleapis.com/compute/v1/projects/cloud-run-hackathon-475303/global/backendServices/piatto-frontend-service
hostRules:
- hosts:
   - 'piatto-cooks.com'
   - 'www.piatto-cooks.com'
   pathMatcher: api-matcher
pathMatchers:
- name: api-matcher
   defaultService: https://www.googleapis.com/compute/v1/projects/cloud-run-hackathon-475303/global/backendServices/piatto-frontend-service
   pathRules:
   - paths:
      - /assets/*
      - /index.html
      - /logo_full_name.svg
      - /logo_no_P.svg
      - /logo_P.svg
      - /logo_P_test.png
      service: https://www.googleapis.com/compute/v1/projects/cloud-run-hackathon-475303/global/backendBuckets/frontend-bucket
   - paths:
      - /api/*
      service: https://www.googleapis.com/compute/v1/projects/cloud-run-hackathon-475303/global/backendServices/fastapi-backend-service
```

Import the YAML:

```bash
gcloud compute url-maps import piatto-url-map \
   --source=piatto-url-map.yaml \
   --global
```

## 9. Nginx cache headers for SPA

On the frontend Nginx (Cloud Run), configure:

- Aggressive cache for immutable assets: `Cache-Control: public, max-age=31536000, immutable`
- Revalidating cache for `index.html`: `Cache-Control: no-cache`

This ensures SPA routes using `try_files ... /index.html` always fetch the latest app shell while assets are long-lived.

## 10. CDN Cache Invalidation (as needed)

Invalidate CDN cache after critical releases if necessary:

```bash
# Invalidate bucket-backed CDN paths
gcloud compute backend-buckets invalidate-cdn-cache frontend-bucket \
   --path "/assets/*,/index.html,/logo_*.svg,/logo_*.png"

# Invalidate frontend service CDN paths (use sparingly)
gcloud compute backend-services invalidate-cdn-cache piatto-frontend-service \
   --global \
   --path "/index.html"
```

## 11. Verification

```bash
curl -I https://piatto-cooks.com/                 # default to frontend (Nginx via CDN)
curl -I https://piatto-cooks.com/api/health       # Cloud Run backend
curl -I https://piatto-cooks.com/assets/...       # CDN + Cloud Storage bucket
```
