"""
Main application entry point for the FastAPI backend.
"""
import asyncio
import atexit
import logging
import os
import secrets
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from .api.schemas import user as user_schema
from .config.settings import SESSION_SECRET_KEY
from .core.lifespan import lifespan
from .utils import auth
from .db.models import user as user_model
# Database tables are created in lifespan.py on startup

#from .api.routers import notifications
# Import routers after DB tables have been created to avoid services querying
# the DB during module import (which caused app_settings queries before
# the table existed).
from .api.routers import auth as auth_router
from .api.routers import chat, files
from .api.routers import users

# Create output directory for flashcard files
output_dir = Path("/tmp/anki_output") if os.path.exists("/tmp") else Path("./anki_output")
output_dir.mkdir(exist_ok=True)

# Create the main app instance
app = FastAPI(
    title="User Management API",
    root_path="/api",
    lifespan=lifespan  # Use the lifespan context manager
)


app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET_KEY
)


# CORS Configuration (remains the same)
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8127",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Define /users/me BEFORE including users.router to ensure correct route matching
@app.get("/users/me", response_model=Optional[user_schema.User], tags=["users"])
async def read_users_me(current_user: Optional[user_model.User] = Depends(auth.get_current_user_optional)):
    """Get the current logged-in user's details."""
    return current_user

# Include your existing routers under this api_router
app.include_router(users.router)
app.include_router(files.router)
app.include_router(auth_router.api_router)
app.include_router(chat.router)


# Mount static files for flashcard downloads
app.mount("/output", StaticFiles(directory=str(output_dir)), name="output")


# The root path "/" is now outside the /api prefix
@app.get("/")
async def root():
    """Status endpoint for the API."""
    return {"message": "Welcome to the User Management API. API endpoints are under /api"}
