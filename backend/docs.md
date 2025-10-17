# README — Piatto Cloud Architektur & Deploy

Diese README fasst **die final funktionierende Architektur** und **alle relevanten Google-Cloud (gcloud/gsutil) Schritte** zusammen — vom Setup der Cloud SQL Instanz über Cloud Run & Secrets bis zu Firebase Hosting, Custom Domain und Cloud Storage (inkl. CORS).
**Kein Changelog, keine Fehlersuche, keine App-Codeschnipsel.** Nur die **Schritte, die zählen** ✅

---

## 1) Architekturüberblick

**Komponenten**

* **Frontend**: Vite/React auf **Firebase Hosting** (Production)
* **Backend**: FastAPI auf **Cloud Run (fully managed)**
  – VPC Connector → **Private IP** zur Datenbank
  – Secrets über **Secret Manager**
* **Datenbank**: **Cloud SQL for MySQL** (Private IP, Region `us-central1`)
* **Container Registry**: **Artifact Registry** (Docker-Repository für Backend-Images)
* **CI/CD**:

  * Backend: GitHub Actions → Build (Docker) → Push to Artifact Registry → Deploy Cloud Run
  * Frontend: GitHub Actions → Build → Deploy Firebase Hosting (Service Account)
* **Domain & DNS**: Cloud DNS + Firebase Hosting Custom Domain
  – Root Domain zeigt auf Firebase Hosting
  – `www → Root` Redirect
  – `/api/**` Rewrite/Proxy zu Cloud Run
* **Dateispeicher**: **Cloud Storage (GCS)** Bucket (privat)
  – Backend IAM Zugriff
  – **CORS** für Direct-Upload aus Frontend
  – **Signed URLs** für sicheren Download/Upload

---

## 2) Cloud SQL (MySQL) — Private IP & VPC Anbindung

**Ziel**: Cloud Run redet privat zur DB (keine öffentliche IP).

1. **Cloud SQL Instanz anlegen** (Konsole):

   * Engine: **MySQL 8.0**
   * Region: **`us-central1`**
   * **Private IP aktivieren** (Service Networking)
     → Interne IP wie `10.73.16.3`
   * **Öffentliche IP deaktivieren**

2. **Serverless VPC Access Connector** (nur einmal je VPC/Region):

   ```bash
   gcloud compute networks vpc-access connectors create svpc-uscentral1 --region=us-central1 --network=default --range=10.8.0.0/28
   ```

3. **Firewallregel**: MySQL Port 3306 aus Connector-Range erlauben:

   ```bash
   gcloud compute firewall-rules create allow-mysql-from-vpc-connector --network=default --allow=tcp:3306 --direction=INGRESS --source-ranges=10.8.0.0/28 --priority=1000
   ```

4. **MySQL Nutzer** (Konsole/SQL Studio):

   * User **`backend`** mit Passwort
   * DB **`piatto`**
   * Standardrechte auf DB vergeben

---

## 3) Artifact Registry — Repository & IAM

1. **API aktivieren** (einmalig):

   ```bash
   gcloud services enable artifactregistry.googleapis.com
   ```

2. **Docker-Repository** für Backend:

   ```bash
   gcloud artifacts repositories create backend-repo --repository-format=docker --location=us-central1 --description="Backend images"
   ```

3. **GitHub Deploy-Service-Account** hat Push-Rechte:

   ```bash
   gcloud projects add-iam-policy-binding cloud-run-hackathon-475303 --member="serviceAccount:github-deployer@cloud-run-hackathon-475303.iam.gserviceaccount.com" --role="roles/artifactregistry.writer"
   ```

> **Hinweis:** GitHub Action baut ein Image und pusht nach
> `us-central1-docker.pkg.dev/cloud-run-hackathon-475303/backend-repo/backend:prod-<commitsha>`

---

## 4) Secret Manager — Secrets & IAM

1. **Secrets anlegen** (Konsole): z. B. `DB_PASSWORD`, `SECRET_KEY`, `SESSION_SECRET_KEY`.

2. **Cloud Run Service Account** (Default: `<PROJECT_NUMBER>-compute@developer.gserviceaccount.com`) erhält **Secret Accessor**:

   ```bash
   gcloud projects add-iam-policy-binding cloud-run-hackathon-475303 --member="serviceAccount:552962719651-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
   ```

> Alternativ Rechte **pro Secret**:
>
> ```bash
> gcloud secrets add-iam-policy-binding DB_PASSWORD --member="serviceAccount:552962719651-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
> ```

---

## 5) Cloud Run — Deploy Backend (mit VPC & Secrets)

**Erstdeploy/Update** (Image-Tag aus CI einfügen):

```bash
gcloud run deploy fastapi-backend \
  --image=us-central1-docker.pkg.dev/cloud-run-hackathon-475303/backend-repo/backend:prod-<commitsha> \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --vpc-connector=svpc-uscentral1 \
  --vpc-egress=private-ranges-only \
  --set-env-vars=DB_HOST=10.73.16.3,DB_PORT=3306,DB_USER=backend,DB_NAME=piatto \
  --set-secrets=DB_PASSWORD=DB_PASSWORD:latest \
  --cpu=1 --memory=512Mi --min-instances=0 --max-instances=3
```

> **Wichtig**: Private IP der DB, VPC Connector, Secrets.
> Für Passwörter mit Sonderzeichen wird URL-Encoding in der App verwendet (kein App-Code hier).

---

## 6) GitHub Actions — Backend CI/CD (kurz)

* Action: **Build Docker → Push → gcloud run deploy**
* Verwendet den **`github-deployer@…`** SA mit ArtifactRegistry Writer + Cloud Run Admin/Deployer (je nach Policy).
* Keine YAML hier; nur IAM-Prämissen & Zielpipeline.

---

## 7) Firebase Hosting — Projekt & Deploy

1. **Firebase APIs** aktiv:

   ```bash
   gcloud services enable firebase.googleapis.com firebasehosting.googleapis.com run.googleapis.com
   ```

2. **Projekt mit Firebase verknüpft** (einmalig erledigt, nur der Vollständigkeit halber):

   ```bash
   firebase projects:list
   # falls nötig:
   # firebase projects:addfirebase cloud-run-hackathon-475303
   ```

3. **Service Account für Hosting Deploy** (falls eigener SA verwendet wird):

   ```bash
   gcloud iam service-accounts create firebase-deployer --display-name="Firebase Hosting Deployer"
   gcloud projects add-iam-policy-binding cloud-run-hackathon-475303 --member="serviceAccount:firebase-deployer@cloud-run-hackathon-475303.iam.gserviceaccount.com" --role="roles/firebasehosting.admin"
   gcloud projects add-iam-policy-binding cloud-run-hackathon-475303 --member="serviceAccount:firebase-deployer@cloud-run-hackathon-475303.iam.gserviceaccount.com" --role="roles/firebase.admin"
   gcloud iam service-accounts keys create firebase-deployer-key.json --iam-account=firebase-deployer@cloud-run-hackathon-475303.iam.gserviceaccount.com
   ```

   * Key-JSON als GitHub Secret (`FIREBASE_SERVICE_ACCOUNT`) hinterlegen.
   * Frontend-Pipeline: Build → `firebase deploy --only hosting`.

4. **Rewrite /api/** → Cloud Run: In Firebase Hosting konfiguriert (kein Snippet hier).
   **Ergebnis**: `/api/**` der Domain wird an `fastapi-backend` (Region `us-central1`) proxied.

---

## 8) Custom Domain — Cloud DNS & Firebase Hosting

**Root Domain** (z. B. `piatto-cooking.com`) → Firebase Hosting

1. In **Firebase Hosting**: Custom Domain hinzufügen.
   Firebase zeigt **A-Record** (z. B. `199.36.158.100`) und **TXT-Record** (z. B. `hosting-site=<projectId>`).

2. **Cloud DNS**: In der passenden **Zone** Einträge setzen:

   * **A Record** (Root, `@`):

     ```text
     Name: (leer lassen)   Type: A   Value: 199.36.158.100
     ```
   * **TXT Record** (Root, `@`):

     ```text
     Name: (leer lassen)   Type: TXT Value: "hosting-site=cloud-run-hackathon-475303"
     ```

3. **www → Root** Redirect:

   * **CNAME**:

     ```text
     Name: www    Type: CNAME    Value: piatto-cooking.com.
     ```
   * Redirect in Firebase Hosting konfigurieren (kein Snippet).
   * TTL **5 Minuten** ist für Setup/Änderungen ideal.

---

## 9) Cloud Storage — Bucket, IAM & CORS (Direct Upload + Signed URLs)

**Bucket**: `piatto-bucket` (privat)

1. **Bucket-Zugriff für Cloud Run SA** (lesen/schreiben):

   ```bash
   gcloud projects add-iam-policy-binding cloud-run-hackathon-475303 \
     --member="serviceAccount:552962719651-compute@developer.gserviceaccount.com" \
     --role="roles/storage.objectAdmin"
   ```

2. **Signed URLs via IAMCredentials (ohne Keyfile in Cloud Run)**:

   ```bash
   gcloud iam service-accounts add-iam-policy-binding 552962719651-compute@developer.gserviceaccount.com \
     --member="serviceAccount:552962719651-compute@developer.gserviceaccount.com" \
     --role="roles/iam.serviceAccountTokenCreator"
   ```

3. **CORS** für Direct Upload aus dem Frontend:

   * Eine `cors.json` lokal erstellen (Origins = deine Produktiv-Domains; Methoden **GET/PUT/HEAD**; Response-Header mind. `Content-Type`, ggf. `x-goog-resumable`; maxAgeSeconds z. B. 3600).
   * Anwenden:

     ```bash
     gsutil cors set cors.json gs://piatto-bucket
     ```
   * Prüfen:

     ```bash
     gsutil cors get gs://piatto-bucket
     ```

> **Muster**: Pfade im Bucket werden logisch strukturiert, z. B. `users/{userId}/...`
> Upload-Flow: Backend vergibt Key/ID → gibt **signed PUT URL** an den Client → Client lädt direkt → Backend behält **permanenten Key** (DB) → Downloads via **signed GET URL** oder optional **public make-public**.

---

## 10) Lokale Entwicklung — Service Account Key & Env

**Nur lokal** (Cloud Run nutzt ADC/Metadata, **kein Keyfile nötig**):

1. **Key** für lokalen Zugriff erzeugen:

   ```bash
   gcloud iam service-accounts keys create service-key.json --iam-account=552962719651-compute@developer.gserviceaccount.com
   ```

2. **Umgebungsvariable** lokal setzen (z. B. `.env`):

   ```text
   GOOGLE_APPLICATION_CREDENTIALS=service-key.json
   ```

3. **Keyfile niemals commiten** (gitignore).

---

## 11) Operative Checkliste

* **Cloud SQL**: Private IP aktiv, VPC Connector + Firewall OK, User/DB vorhanden
* **Secret Manager**: Secrets vorhanden, Cloud Run SA hat **roles/secretmanager.secretAccessor**
* **Artifact Registry**: Repo vorhanden, GitHub SA hat **roles/artifactregistry.writer**
* **Cloud Run**: Service deployed mit `--vpc-connector` + `--vpc-egress=private-ranges-only` und DB-ENV/Secrets
* **Firebase Hosting**: Projekt verknüpft, CI-SA hat **roles/firebasehosting.admin** & **roles/firebase.admin**
* **DNS**: Root A/TXT gesetzt (Firebase Vorgaben), `www` CNAME → Root, TTL 300s
* **GCS**: Bucket privat, Cloud Run SA hat **roles/storage.objectAdmin**, **CORS** gesetzt, optional **serviceAccountTokenCreator** für Signed URLs
* **CI/CD**: GitHub Secrets/SA hinterlegt (Backend Deploy & Hosting Deploy)

---

## 12) Nützliche gcloud/gsutil Kommandos (Referenz)

* Dienste aktivieren:

  ```bash
  gcloud services enable run.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com firebase.googleapis.com firebasehosting.googleapis.com
  ```

* VPC Connector:

  ```bash
  gcloud compute networks vpc-access connectors create svpc-uscentral1 --region=us-central1 --network=default --range=10.8.0.0/28
  ```

* Firewall (MySQL aus Connector):

  ```bash
  gcloud compute firewall-rules create allow-mysql-from-vpc-connector --network=default --allow=tcp:3306 --direction=INGRESS --source-ranges=10.8.0.0/28 --priority=1000
  ```

* Artifact Registry Repo:

  ```bash
  gcloud artifacts repositories create backend-repo --repository-format=docker --location=us-central1
  ```

* Secret-IAM (Projektweit):

  ```bash
  gcloud projects add-iam-policy-binding cloud-run-hackathon-475303 --member="serviceAccount:552962719651-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
  ```

* Cloud Run Deploy (Beispiel):

  ```bash
  gcloud run deploy fastapi-backend --image=us-central1-docker.pkg.dev/cloud-run-hackathon-475303/backend-repo/backend:prod-<commitsha> --region=us-central1 --platform=managed --allow-unauthenticated --vpc-connector=svpc-uscentral1 --vpc-egress=private-ranges-only --set-env-vars=DB_HOST=10.73.16.3,DB_PORT=3306,DB_USER=backend,DB_NAME=piatto --set-secrets=DB_PASSWORD=DB_PASSWORD:latest --cpu=1 --memory=512Mi --min-instances=0 --max-instances=3
  ```

* Firebase Projekt prüfen:

  ```bash
  firebase projects:list
  ```

* Cloud DNS (Konsole): Zone öffnen → Records:

  * Root A: `199.36.158.100`
  * Root TXT: `"hosting-site=cloud-run-hackathon-475303"`
  * `www` CNAME → Root

* GCS CORS:

  ```bash
  gsutil cors set cors.json gs://piatto-bucket
  gsutil cors get gs://piatto-bucket
  ```

* GCS IAM:

  ```bash
  gcloud projects add-iam-policy-binding cloud-run-hackathon-475303 --member="serviceAccount:552962719651-compute@developer.gserviceaccount.com" --role="roles/storage.objectAdmin"
  gcloud iam service-accounts add-iam-policy-binding 552962719651-compute@developer.gserviceaccount.com --member="serviceAccount:552962719651-compute@developer.gserviceaccount.com" --role="roles/iam.serviceAccountTokenCreator"
  ```

* Lokaler SA-Key (nur Entwicklung):

  ```bash
  gcloud iam service-accounts keys create service-key.json --iam-account=552962719651-compute@developer.gserviceaccount.com
  ```

---

## 13) Betrieb & Security Hinweise (kurz)

* **Least Privilege**: Rollen möglichst auf Projektebene nur, wenn notwendig; sonst Secret-/Bucket-spezifisch binden.
* **Cloud Run Min Instances** = 0 spart Kosten; ggf. erhöhen für „Warm Start“.
* **DB-Passwörter** nur aus **Secret Manager**, niemals als Klartext-Env.
* **CORS** nur für benötigte Origins.
* **Signed URLs** bevorzugen statt öffentliche Objekte.
* **DNS TTL 300s** in der Einrichtungsphase pragmatisch, später ggf. erhöhen.
* **Backups/HA** für Cloud SQL je nach SLO aktivieren.

---

Diese README bildet die **verbindliche, funktionierende Zielkonfiguration** ab.
Wenn du irgendwann **Staging** hinzufügen möchtest (zweites Hosting-Target, zweite Cloud-Run-Service-Instanz, zweite DB), erweitern wir die Schritte analog.


## Link zum Chat

[Chat GPT Chat öffnen](https://chatgpt.com/share/68f23c67-42a4-8004-97fd-be80da6845ca)