"""
FastAPI TeuxDeux Clone - Data Models
Pydantic models for request/response validation and SQLAlchemy ORM models
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

# SQLAlchemy ORM Models
class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    color = Column(String, default="#000000")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    todos = relationship("Todo", back_populates="category")

class Todo(Base):
    __tablename__ = "todos"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    scheduled_date = Column(String, nullable=True)  # NULL for someday/topic-based todos
    sort_order = Column(Integer, default=0)
    color = Column(String, nullable=True)  # Individual todo color (optional)
    recurring_pattern = Column(String, nullable=True)  # 'daily', 'weekly', 'monthly', 'yearly'
    parent_id = Column(Integer, ForeignKey("todos.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    category = relationship("Category", back_populates="todos")
    parent = relationship("Todo", remote_side=[id])

class TodoMigration(Base):
    __tablename__ = "todo_migrations"
    
    id = Column(Integer, primary_key=True, index=True)
    todo_id = Column(Integer, ForeignKey("todos.id", ondelete="CASCADE"), nullable=False)
    from_date = Column(String, nullable=True)
    to_date = Column(String, nullable=True)
    migrated_at = Column(DateTime, default=func.now())

# Create indexes
Index('idx_todos_scheduled_date', Todo.scheduled_date)
Index('idx_todos_category_id', Todo.category_id)
Index('idx_todos_completed', Todo.completed)
Index('idx_todos_created_at', Todo.created_at)
Index('idx_categories_sort_order', Category.sort_order)

# Helper classes for Go-style nullable fields
class NullableInt64(BaseModel):
    Int64: int
    Valid: bool

class NullableString(BaseModel):
    String: str
    Valid: bool

# Pydantic Response Models
class CategoryResponse(BaseModel):
    id: int
    name: str
    color: str
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TodoResponse(BaseModel):
    id: int
    title: str
    completed: bool
    category_id: Optional[NullableInt64] = None
    category_name: Optional[str] = None
    category_color: Optional[str] = None
    scheduled_date: Optional[NullableString] = None
    sort_order: int
    color: Optional[NullableString] = None
    recurring_pattern: Optional[NullableString] = None
    parent_id: Optional[NullableInt64] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WeeklyTodos(BaseModel):
    date: str
    day: str
    todos: List[TodoResponse]

class DashboardData(BaseModel):
    weekly_todos: List[WeeklyTodos]
    someday_todos: List[TodoResponse]
    categories: List[CategoryResponse]
    today_date: str
    week_start_date: str

# Pydantic Request Models
class CreateTodoRequest(BaseModel):
    title: str
    category_id: Optional[int] = None
    scheduled_date: Optional[str] = None
    color: Optional[str] = None
    recurring_pattern: Optional[str] = None

class UpdateTodoRequest(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    category_id: Optional[int] = None
    scheduled_date: Optional[str] = None
    sort_order: Optional[int] = None
    color: Optional[str] = None

class CreateCategoryRequest(BaseModel):
    name: str
    color: Optional[str] = None

class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None

class APIResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[dict] = None
    error: Optional[str] = None