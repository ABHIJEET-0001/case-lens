"""
app/db/session.py
─────────────────
Database engine and session factory.
Use get_db() as a FastAPI dependency to get a scoped session per request.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.config import settings

if settings.sqlalchemy_database_url.startswith("sqlite"):
    engine = create_engine(
        settings.sqlalchemy_database_url,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        settings.sqlalchemy_database_url,
        pool_pre_ping=True,     # drops stale connections before using them
        pool_size=10,
        max_overflow=20,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a DB session and closes it on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
