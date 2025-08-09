"""
FastAPI TeuxDeux Clone - Main Application Entry Point
Port of the Go TeuxDeux clone to FastAPI with equivalent functionality
"""

import os
import logging
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import Database
from app.routers import todos, categories, dashboard
from app.migration import run_initial_migration
from app.dependencies import set_database

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database instance
db = Database()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    # Startup
    db_path = os.getenv("DB_PATH", "./teuxdeux.db")
    await db.initialize(db_path)
    set_database(db)  # Set the global database instance
    await run_initial_migration(db)
    yield
    # Shutdown
    await db.close()

app = FastAPI(
    title="TeuxDeux Clone",
    description="A FastAPI port of the TeuxDeux todo application",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_paths = ["./static", "/app/static"]
for path in static_paths:
    if os.path.exists(path):
        app.mount("/static", StaticFiles(directory=path), name="static")
        app.mount("/assets", StaticFiles(directory=os.path.join(path, "dist/assets")), name="assets")
        break

# Include routers
app.include_router(dashboard.router, prefix="/api/v1", tags=["dashboard"])
app.include_router(todos.router, prefix="/api/v1", tags=["todos"])
app.include_router(categories.router, prefix="/api/v1", tags=["categories"])

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Serve the main application HTML"""
    index_paths = [
        "./static/dist/index.html",
        "/app/static/dist/index.html",
        "./go-app/static/dist/index.html"
    ]
    
    for index_path in index_paths:
        if os.path.exists(index_path):
            logger.info(f"Serving index.html from: {index_path}")
            return FileResponse(index_path)
    
    raise HTTPException(status_code=404, detail="index.html not found")

@app.get("/api/v1/health")
@app.head("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    logger.info(f"Starting TeuxDeux Clone FastAPI server on port {port}")
    logger.info(f"Visit http://localhost:{port} to use the application")
    uvicorn.run(app, host="0.0.0.0", port=port)