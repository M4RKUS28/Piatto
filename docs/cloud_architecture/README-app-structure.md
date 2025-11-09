# Piatto Code- und App-Struktur

Diese README ergaenzt `docs/architecture-overview.md`, das die Hosting- und Infrastruktur-Topologie beschreibt. Der Schwerpunkt hier liegt auf Frameworks, Codeaufbau und den wichtigsten Modulen der Anwendung.

## Technologie-Stack

### Frontend

- React 19 mit funktionalen Komponenten und Hooks
- Vite 7 als Dev-Server und Build-Tool
- Tailwind CSS 4 fuer Utility-First-Styling und thematische Tokens aus `frontend/public/locales/*`
- React Router 6 fuer Routing, inklusive geschuetzter Routen
- Axios basierte API-Clients in `frontend/src/api` mit Cookie-Support
- i18next mit `react-i18next` fuer Internationalisierung, getrennte Ressourcen unter `frontend/public/locales`
- Lottie (Animationen), Framer Motion (Micro-Interactions), Lucide React (Icons)

### Backend

- FastAPI als asynchrones Web-Framework mit Lifespan-Hooks (`backend/src/main.py`)
- Starlette Middleware fuer CORS-, Session- und Auth-Handling
- SQLAlchemy Async ORM mit aiomysql (Cloud SQL) und aiosqlite Fallback (`backend/src/db/database.py`)
- Pydantic V2 fuer Datenvalidierung (`backend/src/api/schemas`)
- Authlib OAuth Clients, python-jose JWT Tokens, bcrypt/Passlib fuer Passwort-Hashing (`backend/src/core/security.py`)
- Google Cloud Storage SDK fuer Dateiverwaltung (`backend/src/services/files` und `backend/src/db/bucket_session.py`)
- APScheduler fuer asynchrone Tasks (`backend/requirements.txt`)

### KI-, Voice- und Agenten-Layer

- Google ADK / Gemini 2.5 Flash Modelle ueber `google.genai`
- Abstrakte Agenten-Basis in `backend/src/agents/agent.py`
- Spezialagenten in `backend/src/agents/{chat,image,recipe,...}_agent`
- `backend/src/services/agent_service.py` orchestriert Sitzungen und Laufzeit-Status

### Tooling & Delivery

- ESLint 9 Konfiguration (`frontend/eslint.config.js`)
- Dockerfiles fuer Frontend (`frontend/Dockerfile.prebuilt`) und Backend (`backend/Dockerfile`)
- Firebase und Cloud-CI Templates im Ordner `ALT/`

## Repository-Layout

| Bereich | Pfad | Beschreibung |
| --- | --- | --- |
| Frontend App | `frontend/` | React Single Page App mit `src/`, `public/`, Build- und Tooling-Konfiguration |
| Backend API | `backend/src/` | FastAPI Anwendung, Services, Agenten, Datenbankcode |
| Gemeinsame Doku | `docs/` | Architektur, Flows und diese Struktur-README |
| Voice Assistant Guides | `VOICE_ASSISTANT_SETUP.md`, `VOICE_ASSISTANT_IMPROVEMENTS.md` | Setup-Anleitungen und Verbesserungsvorschlaege |
| Infrastruktur Altlasten | `ALT/` | Historische Deployment-Skripte und Konfigurationen |

## Frontend Architektur

- **Entry Point:** `frontend/src/main.jsx` bindet React, Router und globale Provider ein.
- **Routing & Layout:** `App.jsx` definiert oeffentliche, Auth- und geschuetzte Routen. Layout-Komponenten liegen unter `frontend/src/Layout`.
- **State Management:** `frontend/src/contexts/AuthContext.jsx` realisiert Auth-Zustand. Custom Hooks stehen in `frontend/src/hooks` (z. B. `useMediaQuery`).
- **API Layer:** `frontend/src/api/baseApi.js` kapselt Axios Instanzen, `frontend/src/api/authApi.js` etc. enthalten fachliche Calls.
- **Pages & Features:** Unter `frontend/src/pages` finden sich Feature-spezifische Views, z. B. `pages/app/RecipeLibrary` oder `pages/auth`.
- **UI-Bausteine:** Geteilte Komponenten in `frontend/src/components`, z. B. Modals oder Buttons, folgen den Richtlinien aus `frontend/docs/styleguide.md`.
- **Assets & Styling:** Globale Styles in `frontend/src/index.css`, Bilder/Lotties in `frontend/src/assets` bzw. `frontend/public/lottie-animations`.
- **Internationalisierung:** Sprachdateien liegen in `frontend/public/locales/{en,de}`, automatische Spracherkennung via `i18next-browser-languagedetector`.

## Backend Architektur

- **FastAPI App:** `backend/src/main.py` initialisiert App, Middleware, CORS und bindet Router.
- **Konfiguration:** `.env`-gestuetzte Settings in `backend/src/config/settings.py`, inklusive DB, OAuth und Cookie-Policies.
- **API Layer:** REST-Router pro Domain (`backend/src/api/routers/*`), z. B. `users`, `recipe`, `collection`, `voice_assistant`.
- **Schemas:** Pydantic-Modelle fuer Request/Response liegen parallel in `backend/src/api/schemas`.
- **Business Services:** Fachlogik in `backend/src/services`, u. a. `auth_service`, `chat_service`, `user_service`, `state_service`.
- **Datenbank-Schicht:** SQLAlchemy Modelle und CRUD in `backend/src/db/models` bzw. `backend/src/db/crud`. `seed_data.py` liefert Testdaten.
- **Lifecycle & Routines:** `backend/src/core/lifespan.py` steuert Startup/Shutdown, `backend/src/core/routines.py` fuer wiederkehrende Wartung.
- **Security & Auth:** Token-Verwaltung, OAuth und Passwort-Hashing in `backend/src/core/security.py`. Abhaengigkeiten wie `get_read_write_user_id` sichern Endpoints ab.
- **Voice & KI:** `backend/src/agents` kapselt generative Funktionen, `backend/src/services/agent_service.py` koordiniert Sitzungen, Tools in `backend/src/agents/tools`.

## Daten- und Dateiverwaltung

- Primaerdatenbank ist Cloud SQL (MySQL) mit asynchroner Verbindung. Lokale Entwicklung nutzt SQLite Fallback (`DATABASE_URL` steuert Auswahl).
- Medien- und Dateispeicher erfolgt ueber Google Cloud Storage, Session-basierte Buehne in `backend/src/db/bucket_session.py`.

## Entwicklung & Deployment

- Lokaler Backend-Start via `backend/run.sh` oder `uvicorn backend.src.main:app --reload` nach Abhaengigkeitsinstallation (`pip install -r requirements.txt`).
- Frontend-Entwicklung: `npm install` und `npm run dev` (Vite) im `frontend/` Ordner.
- Docker-basierte Builds: `backend/Dockerfile` und `frontend/Dockerfile.prebuilt`.
- Weitere Ablaeufe (CDN, Firebase, Unified Deployments) siehe `docs/unified-frontend-deployment.md` und `ALT/`.

## Weiterfuehrende Dokumentation

- Infrastruktur & Hosting: `docs/architecture-overview.md`
- API Flows: `docs/BUCKET_API.md`
- Frontend UX Normen: `frontend/docs/styleguide.md`, `frontend/docs/ERROR_HANDLING.md`

Dieses Dokument dient als Schnelluebersicht zur Codebasis. Fuer tiefergehende Prozesse bitte die verlinkten Dateien konsultieren.
