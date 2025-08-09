"""
FastAPI TeuxDeux Clone - Todos Router
CRUD operations for todo items and migration functionality
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.dependencies import get_db_session
from app.models import (
    Todo, TodoMigration, CreateTodoRequest, UpdateTodoRequest, 
    APIResponse
)

router = APIRouter()

@router.post("/todos", response_model=APIResponse)
async def create_todo(
    todo_data: CreateTodoRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new todo"""
    
    todo = Todo(
        title=todo_data.title,
        category_id=todo_data.category_id,
        scheduled_date=todo_data.scheduled_date if todo_data.scheduled_date else None,
        color=todo_data.color if todo_data.color else None,
        recurring_pattern=todo_data.recurring_pattern if todo_data.recurring_pattern else None
    )
    
    db.add(todo)
    await db.commit()
    await db.refresh(todo)
    
    return APIResponse(
        success=True,
        message="Todo created successfully",
        data={"id": todo.id}
    )

@router.put("/todos/{todo_id}", response_model=APIResponse)
async def update_todo(
    todo_id: int = Path(..., description="Todo ID"),
    todo_data: UpdateTodoRequest = None,
    db: AsyncSession = Depends(get_db_session)
):
    """Update an existing todo"""
    
    # Get the todo
    todo = await db.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Update fields that are provided
    update_data = todo_data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    for field, value in update_data.items():
        setattr(todo, field, value)
    
    await db.commit()
    
    return APIResponse(
        success=True,
        message="Todo updated successfully"
    )

@router.delete("/todos/{todo_id}", response_model=APIResponse)
async def delete_todo(
    todo_id: int = Path(..., description="Todo ID"),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete a todo"""
    
    todo = await db.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    await db.delete(todo)
    await db.commit()
    
    return APIResponse(
        success=True,
        message="Todo deleted successfully"
    )

@router.post("/todos/migrate", response_model=APIResponse)
async def migrate_past_todos(
    db: AsyncSession = Depends(get_db_session)
):
    """Migrate incomplete todos from past dates to today"""
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Get all incomplete todos from past dates
    query = select(Todo).where(
        Todo.completed == False,
        Todo.scheduled_date.isnot(None),
        Todo.scheduled_date < today
    )
    
    result = await db.execute(query)
    past_todos = result.scalars().all()
    
    migrated_count = 0
    for todo in past_todos:
        old_date = todo.scheduled_date
        
        # Log the migration
        migration = TodoMigration(
            todo_id=todo.id,
            from_date=old_date,
            to_date=today
        )
        db.add(migration)
        
        # Update todo to today
        todo.scheduled_date = today
        migrated_count += 1
    
    await db.commit()
    
    return APIResponse(
        success=True,
        message=f"Migrated {migrated_count} todos to today",
        data={"migrated_count": migrated_count}
    )