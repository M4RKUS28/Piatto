# Piatto Backend - FastAPI Application

Technical documentation for the Piatto backend API built with FastAPI, SQLAlchemy, and Google ADK.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Request Flow](#request-flow)
- [API Routes](#api-routes)
- [Database Models](#database-models)
- [Agents & AI](#agents--ai)
- [Development Setup](#development-setup)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Overview

The Piatto backend is a production-ready FastAPI application that provides:

- **RESTful API** for recipe management and cooking assistance
- **Multi-Agent AI** orchestration using Google ADK
- **Async Database** operations with SQLAlchemy 2.0
- **OAuth 2.0** authentication with Google
- **Cloud Storage** integration for media files
- **Session Management** for conversational AI

---

## Architecture

### High-Level Design

```text
Client Request
    ↓
FastAPI Router (src/api/routers/*.py)
    ↓
Pydantic Schema Validation (src/api/schemas/*.py)
    ↓
Service Layer (src/services/*.py)
    ├─→ CRUD Operations (src/db/crud/*.py)
    │   ↓
    │   Database Models (src/db/models/*.py)
    │   ↓
    │   Cloud SQL (MySQL)
    │
    └─→ Agent Service (src/services/agent_service.py)
        ↓
        ADK Agents (src/agents/*)
        ↓
        Gemini 2.5 Flash API
```

### Request Flow Example

**Recipe Generation Request:**

1. **Router** (`src/api/routers/recipe.py`) receives POST `/recipe/generate`
2. **Schema** (`src/api/schemas/recipe.py`) validates `GenerateRecipeRequest`
3. **Service** (`src/services/agent_service.py`) orchestrates AI generation
4. **Agent** (`src/agents/recipe_agent/`) calls Gemini via ADK
5. **CRUD** (`src/db/crud/recipe_crud.py`) persists recipe to database
6. **Model** (`src/db/models/db_recipe.py`) defines recipe structure
7. **Response** serialized via Pydantic schema and returned

---

## Tech Stack

- **FastAPI 0.115+** - Async web framework
- **Uvicorn** - ASGI server with multiple workers
- **SQLAlchemy 2.0** - Async ORM
- **aiomysql** - Async MySQL driver (Cloud SQL)
- **aiosqlite** - Async SQLite driver (local fallback)
- **Pydantic V2** - Data validation and serialization
- **Google ADK 1.16.0** - Agent Development Kit
- **Gemini 2.5 Flash** - Foundation model
- **Authlib** - OAuth client library
- **python-jose** - JWT token handling
- **bcrypt/Passlib** - Password hashing
- **Google Cloud Storage SDK** - File storage
- **APScheduler** - Background task scheduling

---

## Project Structure

```text
backend/
├── src/
│   ├── main.py                    # FastAPI app entry point
│   │
│   ├── api/                       # API layer
│   │   ├── routers/              # Route handlers
│   │   │   ├── auth.py           # Authentication endpoints
│   │   │   ├── users.py          # User management
│   │   │   ├── recipe.py         # Recipe CRUD & generation
│   │   │   ├── collection.py     # Recipe collections
│   │   │   ├── instruction.py    # Cooking instructions
│   │   │   ├── cooking.py        # Active cooking session
│   │   │   ├── preparing.py      # Preparation phase
│   │   │   ├── files.py          # File upload/download
│   │   │   ├── chat.py           # Conversational AI
│   │   │   └── voice_assistant.py # Voice interface
│   │   │
│   │   └── schemas/              # Pydantic models
│   │       ├── auth.py           # Auth request/response
│   │       ├── user.py           # User schemas
│   │       ├── recipe.py         # Recipe schemas
│   │       ├── collection.py     # Collection schemas
│   │       ├── chat.py           # Chat message schemas
│   │       └── file.py           # File upload schemas
│   │
│   ├── core/                      # Core functionality
│   │   ├── security.py           # Auth, JWT, password hashing
│   │   ├── lifespan.py           # App startup/shutdown
│   │   └── routines.py           # Scheduled maintenance tasks
│   │
│   ├── config/                    # Configuration
│   │   └── settings.py           # Environment-based settings
│   │
│   ├── db/                        # Database layer
│   │   ├── database.py           # DB connection & session
│   │   ├── bucket_session.py     # Cloud Storage session
│   │   │
│   │   ├── models/               # SQLAlchemy ORM models
│   │   │   ├── db_user.py        # User, UserPreferences
│   │   │   └── db_recipe.py      # Recipe, Ingredient, Instruction, Collection
│   │   │
│   │   └── crud/                 # Database operations
│   │       ├── users_crud.py     # User CRUD
│   │       ├── recipe_crud.py    # Recipe CRUD
│   │       ├── collection_crud.py # Collection CRUD
│   │       ├── instruction_crud.py # Instruction CRUD
│   │       ├── cooking_crud.py   # Cooking session CRUD
│   │       ├── preparing_crud.py # Preparation CRUD
│   │       └── bucket_base_repo.py # Cloud Storage operations
│   │
│   ├── services/                  # Business logic layer
│   │   ├── agent_service.py      # ADK agent orchestration
│   │   ├── auth_service.py       # Authentication logic
│   │   ├── user_service.py       # User management logic
│   │   ├── chat_service.py       # Chat session management
│   │   ├── state_service.py      # Agent state management
│   │   ├── cost_service.py       # Token cost tracking
│   │   ├── query_service.py      # Search & query logic
│   │   └── data_processors/      # Data transformation utilities
│   │
│   ├── agents/                    # Google ADK agents
│   │   ├── agent.py              # Base agent class
│   │   ├── utils.py              # Agent utilities
│   │   │
│   │   ├── recipe_agent/         # Recipe generation agent
│   │   │   └── agent.py
│   │   │
│   │   ├── image_analyzer_agent/ # Image analysis agent
│   │   │   └── agent.py
│   │   │
│   │   ├── instruction_agent/    # Cooking instructions agent
│   │   │   └── agent.py
│   │   │
│   │   ├── chat_agent/           # Conversational agent
│   │   │   └── agent.py
│   │   │
│   │   ├── image_agent/          # Image generation agent
│   │   │   └── agent.py
│   │   │
│   │   └── tools/                # Agent tools & functions
│   │
│   ├── utils/                     # Utilities
│   │   └── auth.py               # Auth dependencies (get_user_id, etc.)
│   │
│   └── test/                      # Test files
│       └── test_agents.py
│
├── Dockerfile                     # Production container
├── requirements.txt               # Python dependencies
├── run.sh                         # Local dev startup script
└── README.md                      # This file
```

---

## Request Flow

### Detailed Workflow

#### 1. Router Layer (Entry Point)

**File:** `src/api/routers/recipe.py`

```python
@router.post("/generate", response_model=RecipeSchema)
async def generate_recipe(
    request: GenerateRecipeRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_read_write_user_id)
):
    # Route handler delegates to service
    result = await agent_service.generate_recipe(
        user_id=user_id,
        request=request,
        db=db
    )
    return result
```

**Responsibilities:**

- HTTP endpoint definition
- Dependency injection (DB session, user auth)
- Input validation via Pydantic schemas
- Response serialization

#### 2. Schema Layer (Validation)

**File:** `src/api/schemas/recipe.py`

```python
class GenerateRecipeRequest(BaseModel):
    prompt: str
    ingredients: Optional[List[str]] = None
    image_urls: Optional[List[str]] = None
    difficulty: Optional[str] = None
    food_category: Optional[str] = None
```

**Responsibilities:**

- Request/response data validation
- Type coercion
- API contract definition
- Documentation generation

#### 3. Service Layer (Business Logic)

**File:** `src/services/agent_service.py`

```python
async def generate_recipe(self, user_id: str, request: GenerateRecipeRequest, db: AsyncSession):
    # Orchestrate AI agents
    state = await state_service.create_state(user_id, request)

    # Call recipe agent via ADK
    agent_response = await recipe_agent.run(
        user_id=user_id,
        state=state,
        content=build_content(request)
    )

    # Parse and persist
    recipe_data = parse_agent_output(agent_response)
    recipe = await recipe_crud.create_recipe(db, user_id, **recipe_data)

    return recipe
```

**Responsibilities:**

- Coordinate multiple agents
- Transform data between layers
- Error handling and retries
- Business rule enforcement

#### 4. CRUD Layer (Database Operations)

**File:** `src/db/crud/recipe_crud.py`

```python
async def create_recipe(
    db: AsyncSession,
    user_id: str,
    title: str,
    ingredients: List[str],
    instructions: str,
    **kwargs
) -> DBRecipe:
    recipe = DBRecipe(
        user_id=user_id,
        title=title,
        ingredients=json.dumps(ingredients),
        instructions=instructions,
        **kwargs
    )
    db.add(recipe)
    await db.commit()
    await db.refresh(recipe)
    return recipe
```

**Responsibilities:**

- Database transactions
- Query construction
- Relationship management
- Data persistence

#### 5. Model Layer (ORM)

**File:** `src/db/models/db_recipe.py`

```python
class DBRecipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), ForeignKey("users.id"))
    title = Column(String(255))
    ingredients = Column(Text)  # JSON string
    instructions = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("DBUser", back_populates="recipes")
    collections = relationship("DBCollection", secondary=recipe_collection_association)
```

**Responsibilities:**

- Table schema definition
- Relationship mapping
- Constraints and indexes

---

## API Routes

### Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | User registration | No |
| POST | `/auth/login` | Email/password login | No |
| GET | `/auth/google` | Initiate Google OAuth | No |
| GET | `/auth/google/callback` | OAuth callback handler | No |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/me` | Get current user | Yes |

### Users (`/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/profile` | Get user profile | Yes |
| PUT | `/users/profile` | Update user profile | Yes |
| DELETE | `/users/account` | Delete user account | Yes |
| GET | `/users/preferences` | Get user preferences | Yes |
| PUT | `/users/preferences` | Update preferences | Yes |

### Recipes (`/recipe`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/recipe/generate` | AI recipe generation | Yes |
| POST | `/recipe/create` | Manual recipe creation | Yes |
| GET | `/recipe/{id}/get` | Get recipe by ID | Yes |
| GET | `/recipe/get_all` | Get all user recipes | Yes |
| PUT | `/recipe/{id}/update` | Update recipe | Yes |
| DELETE | `/recipe/{id}/delete` | Delete recipe | Yes |
| POST | `/recipe/{id}/change_ai` | AI-powered recipe modification | Yes |
| POST | `/recipe/{id}/change_manual` | Manual recipe modification | Yes |

### Collections (`/collection`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/collection/create` | Create collection | Yes |
| GET | `/collection/get_all` | Get all collections | Yes |
| GET | `/collection/{id}/get` | Get collection by ID | Yes |
| PUT | `/collection/{id}/update` | Update collection | Yes |
| DELETE | `/collection/{id}/delete` | Delete collection | Yes |
| POST | `/collection/{id}/add_recipe` | Add recipe to collection | Yes |
| DELETE | `/collection/{id}/remove_recipe` | Remove recipe from collection | Yes |

### Instructions (`/instruction`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/instruction/generate` | Generate step-by-step instructions | Yes |
| GET | `/instruction/{id}/get` | Get instruction by ID | Yes |
| PUT | `/instruction/{id}/update` | Update instruction | Yes |

### Cooking Session (`/cooking`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/cooking/start` | Start cooking session | Yes |
| GET | `/cooking/{id}/get` | Get cooking session | Yes |
| PUT | `/cooking/{id}/update_state` | Update cooking state | Yes |
| POST | `/cooking/{id}/complete` | Complete cooking | Yes |

### Preparing Session (`/preparing`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/preparing/start` | Start prep session | Yes |
| GET | `/preparing/{id}/get` | Get prep session | Yes |
| PUT | `/preparing/{id}/update_state` | Update prep state | Yes |

### Files (`/files`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/files/upload` | Upload file to Cloud Storage | Yes |
| GET | `/files/{filename}` | Download file | Yes |
| DELETE | `/files/{filename}` | Delete file | Yes |

### Chat (`/chat`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chat/message` | Send chat message to AI | Yes |
| GET | `/chat/history` | Get chat history | Yes |
| DELETE | `/chat/clear` | Clear chat history | Yes |

### Voice Assistant (`/voice_assistant`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/voice_assistant/start` | Start voice session | Yes |
| POST | `/voice_assistant/process` | Process voice command | Yes |
| POST | `/voice_assistant/stop` | Stop voice session | Yes |

---

## Database Models

### User Model (`DBUser`)

**File:** `src/db/models/db_user.py`

```python
class DBUser(Base):
    __tablename__ = "users"

    id = Column(String(255), primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Null for OAuth users
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # OAuth fields
    oauth_provider = Column(String(50), nullable=True)  # 'google', 'facebook', etc.
    oauth_id = Column(String(255), nullable=True)

    # Relationships
    recipes = relationship("DBRecipe", back_populates="user")
    collections = relationship("DBCollection", back_populates="user")
    preferences = relationship("DBUserPreferences", uselist=False, back_populates="user")
```

### Recipe Model (`DBRecipe`)

**File:** `src/db/models/db_recipe.py`

```python
class DBRecipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    ingredients = Column(Text)  # JSON: [{"name": "...", "amount": "...", "unit": "..."}]
    instructions = Column(Text)  # JSON: [{"step": 1, "description": "...", "time": ...}]
    image_url = Column(String(512))
    total_time_minutes = Column(Integer)
    difficulty = Column(String(50))  # "easy", "medium", "hard"
    food_category = Column(String(100))  # "italian", "asian", etc.
    prompt = Column(Text)  # Original user prompt
    important_notes = Column(Text)
    cooking_overview = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("DBUser", back_populates="recipes")
    collections = relationship("DBCollection", secondary=recipe_collection_association, back_populates="recipes")
```

### Collection Model (`DBCollection`)

```python
class DBCollection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("DBUser", back_populates="collections")
    recipes = relationship("DBRecipe", secondary=recipe_collection_association, back_populates="collections")
```

---

## Agents & AI

### Agent Architecture

**Base Agent** (`src/agents/agent.py`)

All agents extend `StandardAgent`:

```python
class StandardAgent(ABC):
    def __init__(self, app_name: str, session_service):
        self.app_name = app_name
        self.session_service = session_service
        self.model = "gemini-2.5-flash"

    async def run(self, user_id: str, state: dict, content: types.Content, debug: bool = False):
        # Create ADK session
        session = await self.session_service.create_session(
            app_name=self.app_name,
            user_id=user_id,
            state=state
        )

        # Run agent and process events
        async for event in self.runner.run_async(user_id, session.id, content):
            if event.is_final_response():
                return {"status": "success", "output": event.content.parts[0].text}
```

### Specialized Agents

#### 1. Recipe Agent

**Path:** `src/agents/recipe_agent/agent.py`

**Purpose:** Generate complete recipes from user prompts and ingredient lists

**Input:**

- User prompt (text)
- Ingredients list (optional)
- Image URLs (optional, analyzed by Image Analyzer Agent first)
- Preferences (difficulty, category)

**Output:**

- Recipe title
- Description
- Ingredient list with amounts
- Cooking instructions
- Time estimates
- Difficulty rating

#### 2. Image Analyzer Agent

**Path:** `src/agents/image_analyzer_agent/agent.py`

**Purpose:** Identify ingredients from uploaded photos

**Input:**

- Image URL(s) from Cloud Storage

**Output:**

- List of detected ingredients
- Quantities (if visible)
- Confidence scores

#### 3. Instruction Agent

**Path:** `src/agents/instruction_agent/agent.py`

**Purpose:** Generate detailed step-by-step cooking instructions

**Input:**

- Recipe data
- User skill level

**Output:**

- Numbered cooking steps
- Time per step
- Temperature settings
- Prep tips

#### 4. Chat Agent

**Path:** `src/agents/chat_agent/agent.py`

**Purpose:** Answer cooking questions in context

**Input:**

- User question
- Conversation history
- Current recipe context

**Output:**

- Conversational response
- Cooking tips
- Substitution suggestions

#### 5. Image Agent

**Path:** `src/agents/image_agent/agent.py`

**Purpose:** Generate recipe imagery (future feature)

**Input:**

- Recipe description

**Output:**

- Generated image URL

---

## Development Setup

### Prerequisites

- Python 3.11+
- MySQL (or use SQLite fallback)
- Google Cloud account (for ADK and Cloud Storage)

### Installation

1. **Clone and navigate:**

   ```bash
   cd backend
   ```

2. **Create virtual environment:**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

5. **Run database migrations (if applicable):**

   ```bash
   # Add migration commands here
   ```

6. **Start development server:**

   ```bash
   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   # Or use: ./run.sh
   ```

7. **Access API documentation:**

   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

### Database Setup

**Option 1: SQLite (Local Development)**

```env
DATABASE_URL=sqlite+aiosqlite:///./piatto.db
```

**Option 2: MySQL (Production-like)**

```env
DATABASE_URL=mysql+aiomysql://user:password@localhost:3306/piatto
```

---

## Configuration

### Environment Variables

**File:** `.env`

```env
# Database
DATABASE_URL=mysql+aiomysql://user:pass@host:3306/piatto
DB_HOST=localhost
DB_PORT=3306
DB_USER=backend
DB_PASSWORD=your_password
DB_NAME=piatto

# Security
SECRET_KEY=your-secret-key-min-32-chars
SESSION_SECRET_KEY=your-session-key
SAME_SITE=lax  # or 'none' for cross-domain

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# Google ADK / Gemini
GOOGLE_API_KEY=your-gemini-api-key
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_PROJECT_ID=your-gcp-project-id

# Cloud Storage
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GCS_BUCKET_NAME=piatto-media

# Frontend (for CORS)
FRONTEND_BASE_URL=http://localhost:5173

# Optional
AGENT_DEBUG_MODE=false
```

### Settings Module

**File:** `src/config/settings.py`

Loads and validates all environment variables using Pydantic settings.

---

## Testing

### Run Tests

```bash
# All tests
pytest

# Specific test file
pytest src/test/test_agents.py

# With coverage
pytest --cov=src --cov-report=html
```

### Test Structure

```text
src/test/
├── test_agents.py         # Agent unit tests
├── test_crud.py           # Database operation tests
├── test_routers.py        # API endpoint tests
└── conftest.py            # Pytest fixtures
```

---

## Deployment

### Docker Build

```bash
docker build -t piatto-backend .
docker run -p 8000:8000 --env-file .env piatto-backend
```

### Cloud Run Deployment

```bash
# Build and push to Artifact Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/backend

# Deploy to Cloud Run
gcloud run deploy fastapi-backend \
  --image gcr.io/PROJECT_ID/backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --vpc-connector svpc-uscentral1 \
  --set-secrets DB_PASSWORD=DB_PASSWORD:latest,... \
  --set-env-vars DB_HOST=10.x.x.x,...
```

See [main README](../README.md#deployment) for complete deployment instructions.

---

## Common Patterns

### Adding a New Endpoint

1. **Define Schema** (`src/api/schemas/your_feature.py`):

   ```python
   class YourRequest(BaseModel):
       field: str

   class YourResponse(BaseModel):
       result: str
   ```

2. **Create Router** (`src/api/routers/your_feature.py`):

   ```python
   @router.post("/endpoint", response_model=YourResponse)
   async def your_endpoint(
       request: YourRequest,
       db: AsyncSession = Depends(get_db),
       user_id: str = Depends(get_read_write_user_id)
   ):
       # Business logic
       return YourResponse(result="success")
   ```

3. **Add CRUD** (`src/db/crud/your_feature_crud.py`):

   ```python
   async def create_entity(db: AsyncSession, user_id: str, **kwargs):
       entity = DBYourModel(user_id=user_id, **kwargs)
       db.add(entity)
       await db.commit()
       return entity
   ```

4. **Register Router** (`src/main.py`):

   ```python
   from .api.routers import your_feature
   app.include_router(your_feature.router)
   ```

---

## Troubleshooting

### Common Issues

**Issue:** `Connection to database failed`

- **Solution:** Check `DATABASE_URL` and ensure MySQL is running. For local dev, use SQLite fallback.

**Issue:** `Google ADK authentication error`

- **Solution:** Verify `GOOGLE_API_KEY` is set correctly and has Gemini API access.

**Issue:** `CORS errors from frontend`

- **Solution:** Add frontend URL to `origins` list in `main.py`.

---

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/)
- [Google ADK Documentation](https://cloud.google.com/adk/docs)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Main Project README](../README.md)

---

**For questions or contributions, see the main project repository.**
