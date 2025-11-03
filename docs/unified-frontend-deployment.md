# Unified Frontend Deployment

## Übersicht

Dieses Setup stellt sicher, dass **identische Build-Artifacts** sowohl über Cloud Storage (CDN) als auch über Cloud Run (Nginx) ausgeliefert werden.

## Architektur

```
┌─────────────────┐
│  GitHub Action  │
│   (Build Once)  │
└────────┬────────┘
         │
         ├─── Build Artifacts (einmalig)
         │
         ├──────────────┬──────────────┐
         │              │              │
         v              v              v
   ┌─────────┐   ┌──────────┐   ┌──────────┐
   │ Artifact│   │  Cloud   │   │  Cloud   │
   │ Storage │   │ Storage  │   │   Run    │
   └─────────┘   │  (CDN)   │   │ (Nginx)  │
                 └──────────┘   └──────────┘
```

## Workflow-Schritte

### 1. Build Job (einmalig)
- Checkout Code
- Node.js installieren
- Dependencies installieren
- `npm run build` ausführen
- **Build-Artifacts hochladen** (für die anderen Jobs)

### 2. Deploy to Cloud Storage (parallel)
- Build-Artifacts herunterladen
- Zu Google Cloud Storage hochladen
- Cache-Headers setzen

### 3. Deploy to Cloud Run (parallel)
- Build-Artifacts herunterladen
- **Optimiertes Dockerfile.prebuilt** verwenden (ohne Build-Step)
- Docker Image mit pre-built Assets erstellen
- Zu Artifact Registry pushen
- Auf Cloud Run deployen

## Vorteile

✅ **Identische Assets**: Build läuft nur einmal, beide Deployments nutzen exakt dieselben Dateien
✅ **Konsistente Hashes**: Asset-Hashes sind garantiert identisch (gleicher Build)
✅ **Schneller**: Docker-Build ist deutlich schneller (kein npm install/build)
✅ **Parallel Deployment**: Cloud Storage und Cloud Run deployen gleichzeitig
✅ **Kleineres Docker Image**: Keine Node.js Build-Tools im Image nötig

## Verwendung

### Mit den alten Workflows (getrennt)
```yaml
# Zwei separate Builds → unterschiedliche Hashes ❌
prod-frontend-docker.yml
prod-upload-frontend-gcs.yml
```

### Mit dem neuen Workflow (unified)
```yaml
# Ein Build → identische Assets überall ✅
prod-frontend-unified.yml
```

## Migration

1. **Neuen Workflow aktivieren**: Push auf `prod` Branch
2. **Alte Workflows deaktivieren** (optional): Dateien umbenennen oder löschen
3. **Testen**: Prüfen, ob Asset-URLs identisch sind

## Asset-Hash-Verifikation

Nach dem Deployment kannst du überprüfen, ob die Hashes identisch sind:

```bash
# Cloud Storage
curl -I https://storage.googleapis.com/[YOUR_BUCKET]/assets/index-[HASH].js

# Cloud Run (Nginx)
curl -I https://piatto-frontend-[...].run.app/assets/index-[HASH].js

# Die [HASH]-Teile müssen identisch sein! ✅
```

## Troubleshooting

### Problem: Assets werden nicht gefunden
**Lösung**: Stelle sicher, dass der `dist`-Ordner im Artifact korrekt hochgeladen wurde

### Problem: Docker Build schlägt fehl
**Lösung**: Prüfe, ob `Dockerfile.prebuilt` den richtigen Pfad `COPY dist` verwendet

### Problem: Deployment dauert lange
**Lösung**: Das ist normal beim ersten Mal. Docker Layer Caching beschleunigt zukünftige Builds

## Dateien

- `.github/workflows/prod-frontend-unified.yml` - Hauptworkflow
- `frontend/Dockerfile.prebuilt` - Optimiertes Dockerfile (ohne Build)
- `frontend/Dockerfile` - Original (mit Build, für lokale Entwicklung)
