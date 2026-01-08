# Changelog

All notable changes to the FastAPI TeuxDeux Clone project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Project Overview

FastAPI TeuxDeux Clone is a modern Python port of a TeuxDeux-style todo application. It provides a 7-day calendar view with automated todo migration, category-based organization, and a complete REST API built with FastAPI and SQLAlchemy.

**Technology Stack:**
- FastAPI 0.104.1 - Modern async web framework
- SQLAlchemy 2.0.23 - Async ORM with SQLite
- Pydantic 2.5.0 - Data validation
- Uvicorn 0.24.0 - ASGI server
- Docker & Docker Compose - Containerization

**Key Features:**
- 7-day rolling calendar view
- Someday lists with color-coded categories
- Automatic migration of past todos to current day
- RESTful API with OpenAPI/Swagger documentation
- SQLite database with async support
- Docker deployment support

---

## [1.0.0] - 2026-01-08

### Added

#### Backstage Integration
- Added TechDocs support for Backstage platform integration
- Created `catalog-info.yaml` for service catalog registration
- Configured MkDocs documentation with `mkdocs.yml`
- Added `docs/` directory for technical documentation

#### Documentation
- Complete API documentation in README.md
- Database schema documentation
- Docker deployment guides
- API endpoint reference
- Environment variable configuration guide

### Changed
- Updated project metadata for Backstage compatibility
- Enhanced project documentation structure

---

## [0.2.0] - 2025-09-21

### Changed
- Automated project file updates (4880 characters modified)
- General maintenance and cleanup

---

## [0.1.1] - 2025-09-14

### Changed
- Automated project file updates (140 characters modified)
- Minor configuration adjustments

---

## [0.1.0] - 2025-08-09

### Added

#### Core Application
- FastAPI application with async/await support
- SQLAlchemy ORM models for todos and categories
- Pydantic models for data validation
- Database migration system
- Health check endpoint (`/api/v1/health`)

#### API Endpoints

**Dashboard:**
- `GET /api/v1/dashboard` - Complete dashboard with 7-day view

**Todos:**
- `POST /api/v1/todos` - Create new todo
- `PUT /api/v1/todos/{id}` - Update todo
- `DELETE /api/v1/todos/{id}` - Delete todo
- `POST /api/v1/todos/migrate` - Migrate past todos

**Categories:**
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/{id}` - Update category
- `DELETE /api/v1/categories/{id}` - Delete category

#### Database Schema
- `categories` table with color coding and sort order
- `todos` table with dates and completion status
- `todo_migrations` table for migration history
- Default categories: Personal, Grocery List, Restaurants, Books to Read, Things to Buy

#### Development Infrastructure
- Docker support with Dockerfile
- Docker Compose configuration for easy deployment
- Development and production compose files
- Static file serving
- CORS middleware configuration

#### Testing & Scripts
- `test_calendar_script.py` - Calendar functionality tests
- `test_duplicate_detection.py` - Duplicate detection tests
- `kalender_script.py` - Calendar utility script

### Changed
- Restructured project: moved FastAPI app to root directory
- Removed original Go application code
- Migrated from Go to Python/FastAPI stack

### Removed
- Go-based backend implementation
- Go modules and dependencies

---

## [0.0.1] - 2025-08-09

### Added
- Initial project setup
- Repository initialization
- Basic project structure

---

## Project Status

### What Works

- **Core Functionality** - All main features are operational
- **API Endpoints** - Complete REST API with CRUD operations
- **Database** - SQLite with async support, migrations working
- **Docker Deployment** - Container builds and runs successfully
- **Static Files** - Frontend assets served correctly
- **Health Checks** - Monitoring endpoint operational
- **Auto-Migration** - Past todos automatically move to current day
- **Category Management** - Create, update, delete categories with colors

### In Development

- **TechDocs** - Documentation integration with Backstage platform
- **Testing Coverage** - Expanding unit and integration test suite
- **Performance Optimization** - Database query optimization
- **Frontend Enhancement** - UI/UX improvements for calendar view

### Known Issues

- **Static Path Resolution** - Multiple fallback paths needed for different environments
- **Frontend Build** - Frontend assets reference old `go-app/static/dist/` path
- **Test Coverage** - Limited automated test coverage
- **Documentation** - API examples could be more comprehensive
- **Error Handling** - Some edge cases in date handling need refinement

### Planned Features

- User authentication and authorization
- Multi-user support with data isolation
- PostgreSQL support for production deployments
- WebSocket support for real-time updates
- Mobile-responsive frontend redesign
- Export/import functionality (JSON, CSV)
- Recurring todos
- Tags and filters
- Search functionality
- API rate limiting
- Comprehensive test suite with >80% coverage

---

## Migration Notes

### From Go Version

This project was migrated from a Go-based implementation to FastAPI. Key differences:

**Improvements:**
- Async/await for better performance
- Automatic OpenAPI/Swagger documentation
- Type hints with Pydantic models
- Cleaner dependency injection
- Better error handling with HTTP status codes

**Compatibility:**
- API endpoints maintain compatibility with original Go version
- Database schema remains identical
- Frontend can work with either backend

---

## Development

### Running the Application

```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Local development
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8080
```

### Environment Variables

- `PORT` - Server port (default: 8080)
- `DB_PATH` - SQLite database path (default: ./teuxdeux.db)

### Testing

```bash
# Run test suite
python test_calendar_script.py
python test_duplicate_detection.py
```

---

## Links

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

---

**Note:** This changelog is maintained manually. For detailed commit history, see `git log`.
