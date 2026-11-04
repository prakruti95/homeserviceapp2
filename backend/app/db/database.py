import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

logger = logging.getLogger(__name__)


def get_normalized_database_url(raw_url: str) -> str:
    """
    Ensure the connection string uses the proper driver dialect for SQLAlchemy.
    - postgres:// or postgresql:// -> postgresql+psycopg2://
    - mysql:// -> mysql+pymysql://
    """
    if not raw_url:
        return "mysql+pymysql://root@localhost:3306/homeserve"

    url = raw_url.strip()
    if url.startswith("postgres://"):
        url = "postgresql+psycopg2://" + url[len("postgres://"):]
    elif url.startswith("postgresql://") and "+psycopg2" not in url:
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    elif url.startswith("mysql://") and "+pymysql" not in url:
        url = "mysql+pymysql://" + url[len("mysql://"):]
    return url


def create_configured_engine(url: str):
    normalized_url = get_normalized_database_url(url)
    engine_kwargs = {
        "echo": settings.DEBUG,
        "pool_pre_ping": True,
    }

    if normalized_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    else:
        engine_kwargs["pool_size"] = 10
        engine_kwargs["max_overflow"] = 20
        if "mysql" in normalized_url:
            engine_kwargs["pool_recycle"] = 3600
        elif "postgresql" in normalized_url:
            engine_kwargs["pool_recycle"] = 300

    return create_engine(normalized_url, **engine_kwargs)


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
