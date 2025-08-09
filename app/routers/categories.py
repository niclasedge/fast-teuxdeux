"""
FastAPI TeuxDeux Clone - Categories Router
CRUD operations for todo categories
"""

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.dependencies import get_db_session
from app.models import (
    Category, Todo, CreateCategoryRequest, UpdateCategoryRequest, 
    CategoryResponse, APIResponse
)

router = APIRouter()

@router.get("/categories", response_model=APIResponse)
async def get_categories(
    db: AsyncSession = Depends(get_db_session)
):
    """Get all categories"""
    
    query = select(Category).order_by(Category.sort_order.asc(), Category.name.asc())
    result = await db.execute(query)
    categories = result.scalars().all()
    
    category_responses = [CategoryResponse.from_orm(cat) for cat in categories]
    
    return APIResponse(
        success=True,
        data={"categories": [cat.dict() for cat in category_responses]}
    )

@router.post("/categories", response_model=APIResponse)
async def create_category(
    category_data: CreateCategoryRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new category"""
    
    # Set default color if not provided
    color = category_data.color if category_data.color else "#6b7280"
    
    category = Category(
        name=category_data.name,
        color=color
    )
    
    db.add(category)
    await db.commit()
    await db.refresh(category)
    
    return APIResponse(
        success=True,
        message="Category created successfully",
        data={"id": category.id}
    )

@router.put("/categories/{category_id}", response_model=APIResponse)
async def update_category(
    category_id: int = Path(..., description="Category ID"),
    category_data: UpdateCategoryRequest = None,
    db: AsyncSession = Depends(get_db_session)
):
    """Update an existing category"""
    
    # Get the category
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Update fields that are provided
    update_data = category_data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    for field, value in update_data.items():
        setattr(category, field, value)
    
    await db.commit()
    
    return APIResponse(
        success=True,
        message="Category updated successfully"
    )

@router.delete("/categories/{category_id}", response_model=APIResponse)
async def delete_category(
    category_id: int = Path(..., description="Category ID"),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete a category"""
    
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category is in use
    count_query = select(func.count(Todo.id)).where(Todo.category_id == category_id)
    result = await db.execute(count_query)
    count = result.scalar()
    
    if count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete category: {count} todos are using this category"
        )
    
    await db.delete(category)
    await db.commit()
    
    return APIResponse(
        success=True,
        message="Category deleted successfully"
    )