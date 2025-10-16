import logging
import os

from typing import Literal, cast

from dotenv import load_dotenv


logging.basicConfig(level=logging.INFO)


load_dotenv()

# JWT settings
ALGORITHM = "HS256"
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_please_change_me")
SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", "fallback-key-for-dev")


######
#ALGORITHM: str = "RS256"
#### Private Key (zum Signieren)
# openssl genrsa -out private.pem 2048
#### Public Key (zum Verifizieren)
# openssl rsa -in private.pem -pubout -out public.pem
PUBLIC_KEY: str = os.getenv("PUBLIC_KEY", "")
PRIVATE_KEY: str =  os.getenv("PRIVATE_KEY", "")
######


ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "20"))
REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "360000")) # 100h
SECURE_COOKIE = os.getenv("SECURE_COOKIE", "true").lower() == "true"

_ALLOWED_SAME_SITE = {"lax", "strict", "none"}
_raw = os.getenv("SAME_SITE", "lax").lower()
if _raw not in _ALLOWED_SAME_SITE:
    raise ValueError(f"Invalid SAME_SITE value: {_raw}")
SAME_SITE = cast(Literal["lax", "strict", "none"], _raw)

# Database settings
DB_USER = os.getenv("DB_USER", "your_db_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "your_db_password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432") # Default PostgreSQL port
DB_NAME = os.getenv("DB_NAME", "your_app_db")

SQLALCHEMY_DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
# For SQLite (testing): # SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
# If you prefer the simple psycopg URL scheme you can also use:
# SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Database Pool settings
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600"))  
DB_POOL_PRE_PING = os.getenv("DB_POOL_PRE_PING", "true").lower() == "true"
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "5"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "10"))
DB_CONNECT_TIMEOUT = int(os.getenv("DB_CONNECT_TIMEOUT", "10"))






# Google OAuth settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://www.nexora-ai.de/api/google/callback")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "https://www.nexora-ai.de/google/callback")

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "https://www.nexora-ai.de/api/github/callback")

DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
DISCORD_REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI", "https://www.nexora-ai.de/api/discord/callback")



UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
UNSPLASH_SECRET_KEY = os.getenv("UNSPLASH_SECRET_KEY")


CHROMA_DB_URL = os.getenv("CHROMA_DB_URL", "http://localhost:8000")
AGENT_DEBUG_MODE = os.getenv("AGENT_DEBUG_MODE", "true").lower() == "true"


# ChromaDB settings
CHROMA_HOST = os.getenv("CHROMA_SERVER_HTTP_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_SERVER_HTTP_PORT", "8011"))
CHROMA_COLLECTION_NAME = os.getenv("CHROMA_COLLECTION_NAME", "nexora_content")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
CHROMA_SSL = os.getenv("CHROMA_SSL", "false").lower() in ("true", "1", "t")


MINIO_ENDPOINT=os.getenv("MINIO_ENDPOINT", "dev.nexora-ai.de:9000")


# SSH Restart settings (for Docker Compose restart via SSH)
SSH_RESTART_ENABLED = os.getenv("SSH_RESTART_ENABLED", "false").lower() == "true"
SSH_RESTART_HOST = os.getenv("SSH_RESTART_HOST", "")
SSH_RESTART_USER = os.getenv("SSH_RESTART_USER", "")
SSH_RESTART_KEY_PATH = os.getenv("SSH_RESTART_KEY_PATH", "")
SSH_RESTART_COMPOSE_PATH = os.getenv("SSH_RESTART_COMPOSE_PATH", "")
SSH_RESTART_PROJECT_NAME = os.getenv("SSH_RESTART_PROJECT_NAME", "nexora")

# Admin Quick Links (configurable URLs for admin panel)
QUICK_LINK_PGADMIN_PROD = os.getenv("QUICK_LINK_PGADMIN_PROD", "https://db.nexora-ai.de")
QUICK_LINK_PGADMIN_DEV = os.getenv("QUICK_LINK_PGADMIN_DEV", "https://db.dev.nexora-ai.de")
QUICK_LINK_PGADMIN_LOCAL = os.getenv("QUICK_LINK_PGADMIN_LOCAL", "http://localhost:8090")

QUICK_LINK_MINIO_PROD = os.getenv("QUICK_LINK_MINIO_PROD", "https://minidb.nexora-ai.de/login")
QUICK_LINK_MINIO_DEV = os.getenv("QUICK_LINK_MINIO_DEV", "https://minidb.dev.nexora-ai.de/login")
QUICK_LINK_MINIO_LOCAL = os.getenv("QUICK_LINK_MINIO_LOCAL", "http://localhost:8001")

QUICK_LINK_WEBSITE_PROD = os.getenv("QUICK_LINK_WEBSITE_PROD", "https://www.nexora-ai.de")
QUICK_LINK_WEBSITE_DEV = os.getenv("QUICK_LINK_WEBSITE_DEV", "https://dev.nexora-ai.de")
QUICK_LINK_WEBSITE_LOCAL = os.getenv("QUICK_LINK_WEBSITE_LOCAL", "http://localhost:3000")

QUICK_LINK_CLOUDPANEL = os.getenv("QUICK_LINK_CLOUDPANEL", "https://cp.nexora-ai.de")
QUICK_LINK_GITHUB = os.getenv("QUICK_LINK_GITHUB", "https://github.com/Nexora-AI-de/Nexora")
QUICK_LINK_ANALYTICS = os.getenv("QUICK_LINK_ANALYTICS", "https://analytics.nexora-ai.de")

# FastAPI API Docs (Swagger UI) quick links
QUICK_LINK_API_DOCS_PROD = os.getenv("QUICK_LINK_API_DOCS_PROD", "https://www.nexora-ai.de/api/docs")
QUICK_LINK_API_DOCS_DEV = os.getenv("QUICK_LINK_API_DOCS_DEV", "https://dev.nexora-ai.de/api/docs")
QUICK_LINK_API_DOCS_LOCAL = os.getenv("QUICK_LINK_API_DOCS_LOCAL", "http://localhost:8000/api/docs")












# -------------------------

DB_HOST = os.getenv("DB_HOST")  # 10.73.16.3
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER")  # z. B. root oder custom user
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"mysql+aiomysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"



