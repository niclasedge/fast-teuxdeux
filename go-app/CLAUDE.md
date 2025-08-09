# TeuxDeux Clone - Development Notes

## Project Overview
A Go-based clone of the TeuxDeux todo application featuring a 7-day calendar view and topic-based "someday" lists. Built with Go, SQLite, and vanilla JavaScript.

## Development Commands

### Primary Commands
- `make dev` - Start development server (auto-kills existing processes, cleans cache, rebuilds)
- `make logs` - Show last 100 lines of application logs
- `make status` - Check if server is running
- `make kill-process` - Kill any running server processes

### Additional Commands
- `make build` - Build the application
- `make clean` - Clean build artifacts and cache
- `make test` - Run tests
- `make deps` - Install/update dependencies
- `make help` - Show all available commands

## Architecture

### Backend (Go)
- **Framework**: Gin HTTP router
- **Database**: SQLite with foreign keys enabled
- **Structure**:
  - `cmd/main.go` - Application entry point
  - `internal/database/` - Database connection and schema
  - `internal/handlers/` - HTTP route handlers
  - `internal/models/` - Data models and types
  - `templates/` - HTML templates
  - `static/` - CSS and JavaScript assets

### Database Schema
- **todos** - Main todo items with dates, categories, completion status
- **categories** - Topic-based lists (Personal, Grocery, etc.)
- **todo_migrations** - Migration history tracking

### API Endpoints
- `GET /api/v1/dashboard` - Complete dashboard data
- `POST /api/v1/todos` - Create new todo
- `PUT /api/v1/todos/:id` - Update todo
- `DELETE /api/v1/todos/:id` - Delete todo
- `POST /api/v1/todos/migrate` - Migrate past todos to today
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

## Key Features

### 7-Day Calendar View
- Shows next 7 days starting from today
- Todos can be added to specific dates
- Visual distinction for today's date

### Someday Lists
- Topic-based organization (Books to Read, Grocery List, etc.)
- Color-coded categories
- Unlimited custom categories

### Auto-Migration
- Incomplete todos from past dates automatically move to current day
- Prevents losing unfinished tasks
- Migration history is tracked

### Web Interface
- Clean, minimal design inspired by original TeuxDeux
- Responsive layout for mobile and desktop
- Real-time updates without page refresh
- Modal dialogs for creating categories
- Drag-and-drop ready (structure in place)

## Database Details

### Connection
- SQLite file: `./teuxdeux.db`
- Foreign keys enabled for data integrity
- Automatic schema initialization on startup

### Default Categories
1. Personal (#6b46c1)
2. Grocery List (#059669) 
3. Restaurants (#dc2626)
4. Books to Read (#7c2d12)
5. Things to Buy (#1d4ed8)

## Development Setup

### Requirements
- Go 1.21+
- SQLite3
- Modern web browser

### First Run
```bash
make dev
```
This will:
1. Install dependencies
2. Build the application
3. Initialize database with schema
4. Start server on port 8080
5. Enable file watching (if available)

### File Watching
The Makefile supports auto-restart on file changes:
- macOS: Install `fswatch` with `brew install fswatch`
- Linux: Install `inotify-tools`
- Use `make dev-watch` for auto-restart functionality

## Logging
- Logs saved to `./logs/teuxdeux-clone.log`
- PID file at `./logs/teuxdeux-clone.pid`
- Use `make logs` to view recent entries
- Use `make logs-follow` for real-time log following

## Configuration
- **Port**: 8080 (default, configurable via PORT env var)
- **Database**: SQLite file in current directory
- **Templates**: Auto-detected from multiple paths
- **Static Files**: Auto-detected from multiple paths

## Testing
Test the application with:
```bash
# Health check
curl http://localhost:8080/api/v1/health

# Get dashboard data
curl http://localhost:8080/api/v1/dashboard

# Create a todo for today
curl -X POST http://localhost:8080/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Test todo","scheduled_date":"2025-08-08"}'

# Create a someday todo
curl -X POST http://localhost:8080/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Read a book","category_id":4}'
```

## Troubleshooting

### Server Won't Start
1. Check if port 8080 is in use: `lsof -i :8080`
2. Kill existing processes: `make kill-process`
3. Clean build artifacts: `make clean`
4. Rebuild and restart: `make dev`

### Database Issues
- Database file is created automatically
- Reset database: `rm teuxdeux.db && make dev`
- Schema is embedded in code as fallback

### Template/Static File Issues
- Application tries multiple paths for templates and static files
- Ensure you're running from the project root directory
- Templates: `templates/*` or absolute path
- Static: `static/*` or absolute path

## Future Enhancements
- [ ] Drag and drop for todo reordering
- [ ] Recurring todos
- [ ] Todo search and filtering
- [ ] Export functionality
- [ ] Mobile app (PWA)
- [ ] Multiple user support
- [ ] Dark mode theme