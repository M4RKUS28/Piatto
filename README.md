# Piatto   AI Powered Recipe & Cooking Assistant

![Piatto Logo](frontend/public/logo_full_name.png)

> From Chaos to Culinary Excellence

[Live Demo](https://piatto-cooks.com) | [Documentation](#documentation) | [Architecture](#architecture)

   

## Overview

That's exactly the kind of everyday chaos we're solving with **Piatto**   a smart, AI powered recipe generator and cooking assistant that brings the entire cooking experience into one seamless platform.

With Piatto, you can:

  **Generate personalized recipes** based on your ingredients
  **Get real time cooking guidance** with step by step instructions
  **Ask contextual questions** during cooking
  **Automate timers and measurements** all hands free, all in one interface

Built for the **Google Cloud Run Hackathon**, Piatto showcases serverless architecture at scale, multi agent AI orchestration with Google ADK, and global edge delivery proving you can go from idea to production in minutes.

   

## Features

### Core Functionality

  **AI Recipe Generation**: Generate recipes from ingredients using multi modal AI (text + image input)
  **Image Analysis**: Upload photos of ingredients and let AI identify and suggest recipes
  **Interactive Chat**: Ask cooking questions, get substitution suggestions, and troubleshoot in real time
  **Step by Step Instructions**: Context aware cooking guidance with automated timers
  **Recipe Library**: Save, organize, and share your favorite recipes
  **Multi Language Support**: i18next powered internationalization (English, German)
  **Voice Assistant**: Hands free cooking with voice commands (optional)

### Technical Highlights

  **Serverless Auto Scaling**: Zero to millions scaling with Cloud Run
  **Multi Agent AI**: 5 specialized agents orchestrated via Google ADK
  **Global Edge Delivery**: CDN backed with 150+ Points of Presence
  **Secure & Scalable**: VPC connected Cloud SQL, OAuth 2.0, managed SSL
  **CI/CD Pipeline**: Automated GitHub Actions deployment to Artifact Registry

   

## Tech Stack

### Frontend

  **React 19** with functional components and Hooks
  **Vite 7** for blazing fast dev server and optimized builds
  **Tailwind CSS 4** for utility first styling with custom theme tokens
  **React Router 6** with protected routes
  **i18next** for internationalization
  **Axios** for API communication with cookie based auth
  **Framer Motion** for micro interactions
  **Lottie** for rich animations

### Backend

  **FastAPI** with async/await for high performance API
  **Uvicorn** ASGI server with multiple workers
  **SQLAlchemy 2.0** async ORM with aiomysql (Cloud SQL) and aiosqlite fallback
  **Pydantic V2** for request/response validation
  **Authlib** OAuth clients + **python jose** JWT tokens
  **bcrypt/Passlib** for secure password hashing
  **APScheduler** for background tasks

### AI & Agents

  **Google ADK** (Agent Development Kit) v1.16.0
  **Gemini 2.5 Flash** foundation model
  **Multi Agent Architecture**:
    **Image Analyzer Agent**: Identifies ingredients from photos
    **Recipe Agent**: Generates personalized recipes
    **Instruction Agent**: Creates step by step cooking guides
    **Image Agent**: Generates visual content for recipes
    **Chat Agent**: Handles conversational queries
  **Multi Modal Capabilities**: Text + image processing
  **Structured Output**: Type safe responses via Pydantic schemas

### Cloud Infrastructure (Google Cloud)

  **Cloud Run**: Serverless container platform (Services for API & Frontend)
  **Cloud SQL**: Managed MySQL database with VPC connector
  **Cloud Storage**: Object storage for media files and static assets
  **Cloud CDN**: Global edge caching (150+ PoPs)
  **Cloud Load Balancer**: Global HTTPS LB with SSL termination
  **Artifact Registry**: Container image repository
  **Secret Manager**: Secure credential storage
  **VPC Connector**: Private networking for database access

### DevOps & CI/CD

  **Docker**: Multi stage builds for frontend (Nginx) and backend (Uvicorn)
  **GitHub Actions**: Automated build, test, and deploy pipelines
  **ESLint 9**: Code quality enforcement
  **Managed SSL Certificates**: Automatic HTTPS

   

## Architecture

### High Level Overview

```text
[Client]  - [Global HTTPS Load Balancer]  - Routing:
    /api/*           - Cloud Run (FastAPI)  - Cloud SQL + Cloud Storage
    /assets/*        - Cloud CDN  - Cloud Storage Bucket
    /* (SPA routes)  - Cloud CDN  - Cloud Run (Nginx)  - try_files /index.html
```

### Cloud Infrastructure

**Production Setup** (`piatto cooks.com`, `www.piatto cooks.com`)

  **Project**: `cloud run hackathon 475303`
  **Region**: `us central1`
  **Global IP**: `piatto web ip` (34.8.45.221)
  **Managed Certificate**: `piatto managed cert` (auto renewed)
  **URL Map**: `piatto url map` (declarative routing rules)

**Components**:

1. **Backend Service** (`fastapi backend service`)
     Serverless NEG  - Cloud Run service `fastapi backend`
     Docker: Uvicorn workers  - FastAPI app
     Connections: Cloud SQL (MySQL via VPC), Cloud Storage (GCS SDK)

2. **Frontend Service** (`piatto frontend service`)
     Serverless NEG  - Cloud Run service `piatto frontend`
     Docker: Nginx with `try_files` for SPA routing
     CDN enabled for dynamic content caching

3. **Backend Bucket** (`frontend bucket`)
     Origin: `gs://static web piatto`
     Serves: `/assets/*`, `/index.html`, logo files
     Cache: CDN enabled with origin `Cache Control` headers

**Routing Rules** (stored in `piatto url map.yaml`):
  `/api/*`  - Backend Service (FastAPI)
  `/assets/*`, `/index.html`, logos  - Backend Bucket (Cloud Storage)
  Default  - Frontend Service (Nginx SPA)

**Caching Strategy**:

  Assets (`/assets/*`): `Cache Control: public, max age=31536000, immutable`
  Index (`/index.html`): `Cache Control: no cache` (always revalidate)
  SPA routes: Nginx `try_files` fallback

### Application Architecture

**Repository Layout**:

```text
piatto/
    frontend/              # React SPA
        src/
            api/          # Axios API clients
            components/   # Reusable UI components
            contexts/     # React contexts (AuthContext)
            pages/        # Route based views
            hooks/        # Custom hooks
            main.jsx      # Entry point
        public/           # Static assets & locales
        Dockerfile.prebuilt
        nginx.conf
 
    backend/              # FastAPI API
        src/
            agents/       # ADK agents (base + specialized)
            api/          # Routes, schemas, middleware
            core/         # Security, lifespan, routines
            db/           # Models, CRUD, migrations
            services/     # Business logic layer
            main.py       # FastAPI app
        Dockerfile
        requirements.txt
 
    docs/                 # Architecture & guides
        cloud_architecture/
            1 7/          # Step by step pitch scripts
            architecture overview.md
            README app structure.md
 
    .github/workflows/    # CI/CD pipelines
        prod backend docker.yml
        prod frontend unified.yml
```

**Frontend Architecture**:

  **Entry Point**: `main.jsx`  - React 19, Router, global providers
  **Routing**: `App.jsx` with public, auth, and protected routes
  **State Management**: Context API (`AuthContext.jsx`) + custom hooks
  **API Layer**: `baseApi.js` (Axios instances) + feature specific clients
  **Pages**: Feature modules (`RecipeLibrary`, `VoiceAssistant`, etc.)
  **Styling**: Tailwind CSS 4 with theme tokens in `/locales/*`
  **i18n**: Browser language detection, separate resource bundles

**Backend Architecture**:

  **FastAPI App**: `main.py` initializes app, middleware, CORS, router
  **Configuration**: `.env` based settings (`settings.py`)
  **API Layer**: Domain specific routers (`users`, `recipe`, `collection`, `voice_assistant`)
  **Schemas**: Pydantic models for request/response validation
  **Services**: Business logic (`auth_service`, `chat_service`, `agent_service`)
  **Database**: SQLAlchemy models + CRUD operations, seed data support
  **Lifecycle**: `lifespan.py` manages startup/shutdown hooks
  **Security**: Token management, OAuth, password hashing (`security.py`)
  **AI Layer**: ADK agents with session orchestration (`agent_service.py`)

**Multi Agent Workflow**:

```text
User Input (text/images)
  - Image Analyzer Agent (optional, for photos)
  - Recipe Agent (combines user input + image analysis)
  - Instruction Agent (step by step guide)
  - Image Agent (recipe visuals)
  - Chat Agent (Q&A during cooking)
```

   

## CI/CD Pipeline

### Backend Deployment

**Workflow**: `.github/workflows/prod backend docker.yml`

1. Checkout code
2. Build Docker image with BuildKit cache
3. Push to Artifact Registry: `us central1 docker.pkg.dev/.../backend repo/backend:prod ${GITHUB_SHA}`
4. Deploy to Cloud Run service `fastapi backend`
     VPC connector: `svpc uscentral1`
     Secrets: DB credentials, API keys (from Secret Manager)
     Environment: Database connection, OAuth redirect URIs
     Auto scaling: 0 3 instances, 1 CPU, 512Mi RAM

### Frontend Deployment

**Workflow**: `.github/workflows/prod frontend unified.yml`

**Three Stage Process**:

1. **Build Stage**:
     `npm ci`  - install dependencies
     `npm run build`  - Vite production build
     Upload artifacts for parallel deploy

2. **Cloud Storage Deploy**:
     Download build artifacts
     `gsutil  m rsync  d  r dist gs://static web piatto`
     Set cache headers: `Cache Control: public, max age=3600`

3. **Cloud Run Deploy**:
     Build Docker image (Nginx + prebuilt assets)
     Push to Artifact Registry: `us central1 docker.pkg.dev/.../frontend repo/frontend:prod ${GITHUB_SHA}`
     Deploy to Cloud Run service `piatto frontend`
     Auto scaling: 0 3 instances, 1 CPU, 512Mi RAM

**Trigger**: Push to `prod` branch or manual dispatch

   

## Getting Started

### Prerequisites

  **Node.js 20+** (frontend)
  **Python 3.11+** (backend)
  **Docker** (optional, for containerized development)
  **Google Cloud Account** with Cloud Run, Cloud SQL, Cloud Storage enabled
  **Google ADK API Key** (for Gemini access)

### Local Development

#### Backend Setup

```bash
cd backend

# Install dependencies
pip install  r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials, API keys, etc.

# Run database migrations (if applicable)
# alembic upgrade head

# Start development server
uvicorn src.main:app   reload
# Or use: ./run.sh
```

**Backend runs on**: `http://localhost:8000`
**API docs**: `http://localhost:8000/docs` (Swagger UI)

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (if needed)
# cp .env.example .env

# Start development server
npm run dev
```

**Frontend runs on**: `http://localhost:5173`

#### Environment Variables

**Backend** (`.env`):
```env
# Database
DATABASE_URL=mysql+aiomysql://user:pass@host:3306/piatto
# Or SQLite for local: DATABASE_URL=sqlite+aiosqlite:///./piatto.db

# Security
SECRET_KEY=your secret key
SESSION_SECRET_KEY=your session key

# Google OAuth
GOOGLE_CLIENT_ID=your client id
GOOGLE_CLIENT_SECRET=your client secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# Google ADK / Gemini
GOOGLE_API_KEY=your gemini api key
GOOGLE_GENAI_USE_VERTEXAI=FALSE

# Cloud Storage (optional for local dev)
GOOGLE_CLOUD_PROJECT=your project id
```

**Frontend**:
Frontend config is handled via Vite's `import.meta.env` if needed.

   

## Deployment

### Deploy to Google Cloud Run

#### 1. Setup Google Cloud Project

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com \
  vpcaccess.googleapis.com
```

#### 2. Create Cloud SQL Instance

```bash
gcloud sql instances create piatto db \
    database version=MYSQL_8_0 \
    tier=db f1 micro \
    region=us central1

# Create database
gcloud sql databases create piatto   instance=piatto db

# Create user
gcloud sql users create backend \
    instance=piatto db \
    password=YOUR_PASSWORD
```

#### 3. Create Cloud Storage Bucket

```bash
# Static assets bucket
gsutil mb  l us central1 gs://static web YOUR_PROJECT_ID

# Media files bucket (optional)
gsutil mb  l us central1 gs://piatto media YOUR_PROJECT_ID
```

#### 4. Create VPC Connector

```bash
gcloud compute networks vpc access connectors create svpc uscentral1 \
    region=us central1 \
    range=10.8.0.0/28
```

#### 5. Store Secrets

```bash
echo  n "YOUR_DB_PASSWORD" | gcloud secrets create DB_PASSWORD   data file= 
echo  n "YOUR_SECRET_KEY" | gcloud secrets create SECRET_KEY   data file= 
# Repeat for other secrets...
```

#### 6. Deploy Backend

```bash
cd backend

# Build and push
gcloud builds submit   tag gcr.io/YOUR_PROJECT_ID/backend

# Deploy
gcloud run deploy fastapi backend \
    image gcr.io/YOUR_PROJECT_ID/backend \
    region us central1 \
    platform managed \
    allow unauthenticated \
    vpc connector svpc uscentral1 \
    vpc egress private ranges only \
    set env vars DB_HOST=10.x.x.x,DB_PORT=3306,... \
    set secrets DB_PASSWORD=DB_PASSWORD:latest,...
```

#### 7. Deploy Frontend

```bash
cd frontend

# Build assets
npm run build

# Upload to Cloud Storage
gsutil  m rsync  d  r dist gs://static web YOUR_PROJECT_ID

# Build and deploy Nginx service
gcloud builds submit   tag gcr.io/YOUR_PROJECT_ID/frontend  f Dockerfile.prebuilt

gcloud run deploy piatto frontend \
    image gcr.io/YOUR_PROJECT_ID/frontend \
    region us central1 \
    platform managed \
    allow unauthenticated
```

#### 8. Setup Load Balancer & CDN

Follow the detailed steps in [docs/cloud_architecture/architecture overview.md](docs/cloud_architecture/architecture overview.md) to configure:
  Global HTTPS Load Balancer
  URL Map with routing rules
  Backend services (Cloud Run NEGs)
  Backend bucket (Cloud Storage)
  Managed SSL certificate
  Cloud CDN

**Quick reference**:
```bash
# Import URL map from declarative config
gcloud compute url maps import piatto url map \
    source=piatto url map.yaml \
    global \
    project=YOUR_PROJECT_ID
```


## Documentation

  **[Architecture Overview](docs/cloud_architecture/architecture overview.md)**: Cloud infrastructure topology
  **[App Structure](docs/cloud_architecture/README app structure.md)**: Code organization and frameworks
  **[Pitch Scripts](docs/cloud_architecture/)**: Step by step presentation guide (Steps 1 7)
  **[Voice Assistant Setup](VOICE_ASSISTANT_SETUP.md)**: Optional voice interface configuration
  **[Frontend Style Guide](frontend/docs/styleguide.md)**: UI/UX conventions
  **[Error Handling](frontend/docs/ERROR_HANDLING.md)**: Frontend error patterns


## API Reference

Once the backend is running, visit the interactive API documentation:

  **Swagger UI**: `https://YOUR_DOMAIN/docs`
  **ReDoc**: `https://YOUR_DOMAIN/redoc`

**Key Endpoints**:
  `POST /api/auth/register`   User registration
  `POST /api/auth/login`   Email/password login
  `GET /api/auth/google`   OAuth login initiation
  `POST /api/recipe/generate`   AI recipe generation
  `POST /api/chat/message`   Conversational AI
  `GET /api/collection`   User's recipe library
  `POST /api/voice assistant/start`   Voice session


## Project Highlights

### Why Piatto?

**Everyday Chaos  - Culinary Excellence**

Cooking shouldn't be stressful. Piatto eliminates decision fatigue, provides real time guidance, and adapts to your ingredients all powered by cutting edge AI.

### Hackathon Alignment

Built for the **Google Cloud Run Hackathon   AI Agents Category**:

  **Multi Agent ADK Architecture**: 5 specialized agents working in orchestration
  **Deployed on Cloud Run**: Serverless services with auto scaling (0 to N)
  **Production Ready**: Global HTTPS Load Balancer, Cloud CDN, managed SSL
  **Real World Impact**: Solves everyday cooking challenges at scale

### Technical Achievements

  **Serverless at Scale**: From idea to global deployment in minutes
  **Multi Modal AI**: Text + image processing via Gemini 2.5 Flash
  **Global Performance**: 150+ PoP CDN with edge caching
  **Secure by Design**: VPC isolation, OAuth 2.0, Secret Manager
  **DevOps Excellence**: Automated CI/CD with GitHub Actions
  **Pay Per Use**: Cost optimized with Cloud Run's consumption based pricing


## Team

Built with passion by a team dedicated to making cooking accessible, enjoyable, and intelligent.


## License

This project was created for the Google Cloud Run Hackathon 2025.


## Acknowledgments

  **Google Cloud Platform** for serverless infrastructure
  **Google ADK** for multi agent orchestration
  **Gemini 2.5 Flash** for AI capabilities
  **Cloud Run Hackathon** for the inspiration and opportunity


**Ready to cook smarter? Try Piatto at [piatto cooks.com](https://piatto cooks.com)**
