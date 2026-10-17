"""
AURA MINI - Database & Application Configuration
Reads environment variables for PostgreSQL and runtime settings.
"""

import os
from urllib.parse import urlparse
from typing import Dict, Any

# Load environment variables (from .env file if available)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# PostgreSQL Connection Settings
POSTGRES_USER = os.getenv("POSTGRES_USER", "aura_user")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "aura_password")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "aura_db")

# Constructed or overridden DATABASE_URL
DEFAULT_DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)


def get_db_params() -> Dict[str, Any]:
    """Parse connection parameters from DATABASE_URL or individual environment variables."""
    if DATABASE_URL:
        # Normalize postgres:// to postgresql:// if needed
        url = DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        
        parsed = urlparse(url)
        return {
            "dbname": parsed.path.lstrip("/") or POSTGRES_DB,
            "user": parsed.username or POSTGRES_USER,
            "password": parsed.password or POSTGRES_PASSWORD,
            "host": parsed.hostname or POSTGRES_HOST,
            "port": parsed.port or POSTGRES_PORT,
        }
    
    return {
        "dbname": POSTGRES_DB,
        "user": POSTGRES_USER,
        "password": POSTGRES_PASSWORD,
        "host": POSTGRES_HOST,
        "port": POSTGRES_PORT,
    }
