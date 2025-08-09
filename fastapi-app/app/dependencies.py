"""
FastAPI TeuxDeux Clone - Dependency Injection
Provides database session dependency for FastAPI routes
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

# Global database instance (will be set by main.py)
_database = None

def set_database(db):
    """Set the global database instance"""
    global _database
    _database = db

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session dependency"""
    if not _database:
        raise RuntimeError("Database not initialized")
    
    async with _database.SessionLocal() as session:
        yield session