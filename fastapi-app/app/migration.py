"""
FastAPI TeuxDeux Clone - Database Migration Functions
Handle automatic migration of past incomplete todos to today
"""

import logging
from datetime import datetime
from sqlalchemy import text
from app.database import Database

logger = logging.getLogger(__name__)

async def run_initial_migration(db: Database):
    """Run initial migration to move past incomplete todos to today"""
    today = datetime.now().strftime("%Y-%m-%d")
    
    async with db.SessionLocal() as session:
        # Check for incomplete todos from past dates
        result = await session.execute(
            text("""
                SELECT COUNT(*) as count FROM todos 
                WHERE completed = false 
                AND scheduled_date IS NOT NULL 
                AND scheduled_date < :today
            """),
            {"today": today}
        )
        count = result.scalar()
        
        if count > 0:
            logger.info(f"Found {count} incomplete todos from past dates, migrating to today...")
            
            # Migrate them
            await session.execute(
                text("""
                    UPDATE todos 
                    SET scheduled_date = :today 
                    WHERE completed = false 
                    AND scheduled_date IS NOT NULL 
                    AND scheduled_date < :today
                """),
                {"today": today}
            )
            
            await session.commit()
            logger.info(f"Successfully migrated {count} todos to today")
        else:
            logger.info("No past todos to migrate")