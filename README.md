# FastAPI TeuxDeux Clone

A FastAPI port of the Go TeuxDeux clone application, providing equivalent functionality with modern Python web framework features.

## Features

- **7-Day Calendar View**: Shows next 7 days starting from today
- **Someday Lists**: Topic-based organization with color-coded categories
- **Auto-Migration**: Incomplete todos from past dates automatically move to current day
- **REST API**: Full CRUD operations for todos and categories
- **SQLite Database**: Lightweight, persistent storage with async support
- **Docker Support**: Easy deployment with Docker Compose

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

The application will be available at `http://localhost:8080`

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python -m uvicorn app.main:app --reload --port 8080
```

## API Endpoints

### Dashboard
- `GET /api/v1/dashboard?weekOffset=0` - Get complete dashboard data

### Todos
- `POST /api/v1/todos` - Create new todo
- `PUT /api/v1/todos/{id}` - Update todo
- `DELETE /api/v1/todos/{id}` - Delete todo
- `POST /api/v1/todos/migrate` - Migrate past todos to today

### Categories
- `GET /api/v1/categories` - List all categories
- `POST /api/v1/categories` - Create new category
- `PUT /api/v1/categories/{id}` - Update category
- `DELETE /api/v1/categories/{id}` - Delete category

### Health Check
- `GET /api/v1/health` - Application health status

## Database Schema

The application uses SQLite with the following tables:

- **categories**: Todo categories with colors and sort order
- **todos**: Main todo items with dates, completion status, and category links
- **todo_migrations**: Migration history tracking

### Default Categories

1. Personal (#6b46c1)
2. Grocery List (#059669)
3. Restaurants (#dc2626)
4. Books to Read (#7c2d12)
5. Things to Buy (#1d4ed8)

## Environment Variables

- `PORT`: Server port (default: 8080)
- `DB_PATH`: SQLite database path (default: ./teuxdeux.db)

## Testing

### Health Check
```bash
curl http://localhost:8080/api/v1/health
```

### Get Dashboard Data
```bash
curl http://localhost:8080/api/v1/dashboard
```

### Create a Todo for Today
```bash
curl -X POST http://localhost:8080/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Test todo","scheduled_date":"2025-08-09"}'
```

### Create a Someday Todo
```bash
curl -X POST http://localhost:8080/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Read a book","category_id":4}'
```

## Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: Async ORM with SQLite support
- **Pydantic**: Data validation and settings management
- **Uvicorn**: ASGI server implementation
- **Docker**: Containerization and deployment

## Project Structure

```
fastapi-app/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application entry point
│   ├── database.py          # Database connection and setup
│   ├── migration.py         # Database migration functions
│   ├── models.py            # SQLAlchemy ORM and Pydantic models
│   └── routers/
│       ├── __init__.py
│       ├── dashboard.py     # Dashboard endpoints
│       ├── todos.py         # Todo CRUD endpoints
│       └── categories.py    # Category CRUD endpoints
├── requirements.txt         # Python dependencies
├── Dockerfile              # Container configuration
├── docker-compose.yml      # Multi-container setup
└── README.md              # This file
```

## Differences from Go Version

- **Async/Await**: Full async support for better performance
- **Type Hints**: Strong typing with Pydantic models
- **Auto Documentation**: FastAPI provides automatic OpenAPI/Swagger docs
- **Dependency Injection**: Clean separation of concerns with FastAPI dependencies
- **Error Handling**: Structured error responses with HTTP status codes

## Development

The FastAPI version maintains API compatibility with the original Go application while leveraging Python's ecosystem and FastAPI's modern features.