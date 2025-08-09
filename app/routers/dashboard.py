"""
FastAPI TeuxDeux Clone - Dashboard Router
Dashboard endpoint for getting complete application data
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, and_

from app.dependencies import get_db_session
from app.models import (
    Todo, Category, DashboardData, WeeklyTodos, 
    TodoResponse, CategoryResponse, APIResponse, NullableInt64, NullableString
)

router = APIRouter()

@router.get("/dashboard", response_model=APIResponse)
async def get_dashboard(
    weekOffset: int = Query(0, description="Week offset from current week"),
    db: AsyncSession = Depends(get_db_session)
):
    """Get dashboard data with 7-day view and someday todos"""
    
    # Calculate dates
    today = datetime.now()
    today_str = today.strftime("%Y-%m-%d")
    start_date = today + timedelta(days=weekOffset)
    week_start_str = start_date.strftime("%Y-%m-%d")
    
    # Build weekly todos for 7 days
    weekly_todos = []
    for i in range(7):
        date = start_date + timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        day_name = date.strftime("%A")
        
        # Get todos for this date
        todos_query = select(Todo).options(selectinload(Todo.category)).where(
            Todo.scheduled_date == date_str
        ).order_by(Todo.sort_order.asc(), Todo.created_at.asc())
        
        result = await db.execute(todos_query)
        todos = result.scalars().all()
        
        # Convert to response format
        todo_responses = []
        for todo in todos:
            todo_response = TodoResponse(
                id=todo.id,
                title=todo.title,
                completed=todo.completed,
                category_id=NullableInt64(Int64=todo.category_id, Valid=True) if todo.category_id else None,
                category_name=todo.category.name if todo.category else None,
                category_color=todo.category.color if todo.category else None,
                scheduled_date=NullableString(String=todo.scheduled_date, Valid=True) if todo.scheduled_date else None,
                sort_order=todo.sort_order,
                color=NullableString(String=todo.color, Valid=True) if todo.color else None,
                recurring_pattern=NullableString(String=todo.recurring_pattern, Valid=True) if todo.recurring_pattern else None,
                parent_id=NullableInt64(Int64=todo.parent_id, Valid=True) if todo.parent_id else None,
                created_at=todo.created_at,
                updated_at=todo.updated_at
            )
            todo_responses.append(todo_response)
        
        weekly_todos.append(WeeklyTodos(
            date=date_str,
            day=day_name,
            todos=todo_responses
        ))
    
    # Get someday todos (no scheduled_date)
    someday_query = select(Todo).options(selectinload(Todo.category)).where(
        Todo.scheduled_date.is_(None)
    ).order_by(Todo.category_id.asc(), Todo.sort_order.asc(), Todo.created_at.asc())
    
    result = await db.execute(someday_query)
    someday_todos_orm = result.scalars().all()
    
    someday_todos = []
    for todo in someday_todos_orm:
        todo_response = TodoResponse(
            id=todo.id,
            title=todo.title,
            completed=todo.completed,
            category_id=NullableInt64(Int64=todo.category_id, Valid=True) if todo.category_id else None,
            category_name=todo.category.name if todo.category else None,
            category_color=todo.category.color if todo.category else None,
            scheduled_date=NullableString(String=todo.scheduled_date, Valid=True) if todo.scheduled_date else None,
            sort_order=todo.sort_order,
            color=NullableString(String=todo.color, Valid=True) if todo.color else None,
            recurring_pattern=NullableString(String=todo.recurring_pattern, Valid=True) if todo.recurring_pattern else None,
            parent_id=NullableInt64(Int64=todo.parent_id, Valid=True) if todo.parent_id else None,
            created_at=todo.created_at,
            updated_at=todo.updated_at
        )
        someday_todos.append(todo_response)
    
    # Get categories
    categories_query = select(Category).order_by(Category.sort_order.asc(), Category.name.asc())
    result = await db.execute(categories_query)
    categories_orm = result.scalars().all()
    categories = [CategoryResponse.from_orm(cat) for cat in categories_orm]
    
    dashboard_data = DashboardData(
        weekly_todos=weekly_todos,
        someday_todos=someday_todos,
        categories=categories,
        today_date=today_str,
        week_start_date=week_start_str
    )
    
    return APIResponse(
        success=True,
        data=dashboard_data.dict()
    )