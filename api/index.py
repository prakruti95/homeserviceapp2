import sys
import os
import logging

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.db.init_db import init_db

# Initialize database schema and essential seeds
try:
    init_db()
except Exception as e:
    logging.getLogger("api.index").warning(f"init_db initialization warning: {e}")
