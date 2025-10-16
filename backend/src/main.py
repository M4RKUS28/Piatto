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
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

from .api.schemas import user as user_schema
from .config.settings import SESSION_SECRET_KEY
from .core.lifespan import lifespan
from .core.routines import update_stuck_courses
from .db.database import SessionLocal, engine
from .db.models import db_app_setting as app_setting_model
from .db.models import db_chat as chat_model
from .db.models import db_course as course_model
from .db.models import db_file as file_model
from .db.models import db_note as note_model
from .db.models import db_usage as usage_model
from .db.models import db_user as user_model
from .utils import auth

# Create database tables

# Move this to alembic migrations later
user_model.Base.metadata.create_all(bind=engine)
app_setting_model.Base.metadata.create_all(bind=engine)
chat_model.Base.metadata.create_all(bind=engine)
file_model.Base.metadata.create_all(bind=engine)
note_model.Base.metadata.create_all(bind=engine)
usage_model.Base.metadata.create_all(bind=engine)
course_model.Base.metadata.create_all(bind=engine)  # Must be after user_model for ForeignKeys

#from .api.routers import notifications
# Import routers after DB tables have been created to avoid services querying
# the DB during module import (which caused app_settings queries before
# the table existed).
from .api.routers import admin
from .api.routers import auth as auth_router
from .api.routers import chat, courses, files, flashcard, notes, questions
from .api.routers import search as search_router
from .api.routers import statistics, users

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


#import time

#from starlette.middleware.base import BaseHTTPMiddleware


#class TimingMiddleware(BaseHTTPMiddleware):
#    async def dispatch(self, request, call_next):
#        start = time.time()
#        response = await call_next(request)
#        duration = (time.time() - start) * 1000
#        # Use logging instead of print to record request timings
#        logging.getLogger(__name__).info("Request %s took %.2f ms", request.url.path, duration)
#        return response
#
#app.add_middleware(TimingMiddleware)


# Define /users/me BEFORE including users.router to ensure correct route matching
@app.get("/users/me", response_model=Optional[user_schema.User], tags=["users"])
async def read_users_me(current_user: Optional[user_model.User] = Depends(auth.get_current_user_optional)):
    """Get the current logged-in user's details."""
    return current_user

# Include your existing routers under this api_router
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(files.router)
app.include_router(search_router.router)  # Add search router
app.include_router(statistics.router)
app.include_router(auth_router.api_router)
app.include_router(notes.router)
#app.include_router(notifications.router)
app.include_router(questions.router)
app.include_router(chat.router)
app.include_router(flashcard.router)
app.include_router(admin.router)

# Mount static files for flashcard downloads
app.mount("/output", StaticFiles(directory=str(output_dir)), name="output")


# The root path "/" is now outside the /api prefix
@app.get("/")
async def root():
    """Status endpoint for the API."""
    return {"message": "Welcome to the User Management API. API endpoints are under /api"}
