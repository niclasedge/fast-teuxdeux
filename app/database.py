"""
FastAPI TeuxDeux Clone - Database Connection and Initialization
SQLAlchemy async database setup with SQLite
"""

import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import Base, Category

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
    
    async def initialize(self, db_path: str):
        """Initialize database connection and create tables"""
        # Create database URL
        database_url = f"sqlite+aiosqlite:///{db_path}"
        
        # Create async engine
        self.engine = create_async_engine(
            database_url,
            echo=False,  # Set to True for SQL debugging
            connect_args={"check_same_thread": False}
        )
        
        # Create session factory
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine,
            class_=AsyncSession
        )
        
        # Create tables
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        # Insert default categories
        await self._insert_default_categories()
        
        logger.info(f"Database initialized: {db_path}")
    
    async def _insert_default_categories(self):
        """Insert default categories if they don't exist"""
        default_categories = [
            {"id": 1, "name": "Personal", "color": "#6b46c1", "sort_order": 1},
            {"id": 2, "name": "Grocery List", "color": "#059669", "sort_order": 2},
            {"id": 3, "name": "Restaurants", "color": "#dc2626", "sort_order": 3},
            {"id": 4, "name": "Books to Read", "color": "#7c2d12", "sort_order": 4},
            {"id": 5, "name": "Things to Buy", "color": "#1d4ed8", "sort_order": 5},
        ]
        
        async with self.SessionLocal() as session:
            for cat_data in default_categories:
                # Check if category already exists
                existing = await session.get(Category, cat_data["id"])
                if not existing:
                    category = Category(**cat_data)
                    session.add(category)
            
            await session.commit()
    
    async def get_session(self) -> AsyncSession:
        """Get database session"""
        async with self.SessionLocal() as session:
            yield session
    
    async def close(self):
        """Close database connection"""
        if self.engine:
            await self.engine.dispose()

# Global database instance
database = Database()