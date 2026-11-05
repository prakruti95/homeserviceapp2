import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

logger = logging.getLogger(__name__)


def get_normalized_database_url(raw_url: str) -> str:
    """
    Ensure the connection string uses the proper driver dialect for SQLAlchemy.
    - postgres:// or postgresql:// -> postgresql+psycopg2:// or postgresql+pg8000://
    - mysql:// -> mysql+pymysql://
    - sqlite:// -> sqlite:///...
    """
    if not raw_url:
        is_serverless = os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME")
        if is_serverless:
            return "sqlite:////tmp/homeserve.db"
        return "mysql+pymysql://root@localhost:3306/homeserve"

    url = raw_url.strip()

    # Normalize PostgreSQL dialects
    if url.startswith("postgres://"):
        url = "postgresql+psycopg2://" + url[len("postgres://"):]
    elif url.startswith("postgresql://") and not any(d in url for d in ("+psycopg2", "+pg8000", "+asyncpg")):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    elif url.startswith("mysql://") and "+pymysql" not in url:
        url = "mysql+pymysql://" + url[len("mysql://"):]

    return url


def create_configured_engine(url: str):
    normalized_url = get_normalized_database_url(url)
    engine_kwargs = {
        "echo": False,
    }

    if normalized_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        return create_engine(normalized_url, **engine_kwargs)

    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    if "mysql" in normalized_url:
        engine_kwargs["pool_recycle"] = 3600
    elif "postgresql" in normalized_url:
        engine_kwargs["pool_recycle"] = 300

    try:
        test_engine = create_engine(normalized_url, **engine_kwargs)
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected successfully to primary database.")
        return test_engine
    except Exception as e:
        logger.warning(f"Could not connect to primary database ({e}). Falling back to SQLite.")
        fallback_path = "/tmp/homeserve.db" if (os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME")) else "homeserve.db"
        return create_engine(f"sqlite:///{fallback_path}", connect_args={"check_same_thread": False})


engine = create_configured_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
