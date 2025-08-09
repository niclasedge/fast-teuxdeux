# TeuxDeux Clone

A Go-based clone of the TeuxDeux todo application featuring a 7-day calendar view and topic-based "someday" lists. Built with Go, SQLite, and React/TypeScript.

## Features

- **7-Day Calendar View**: Shows next 7 days starting from today
- **Someday Lists**: Topic-based organization (Books to Read, Grocery List, etc.)
- **Drag & Drop**: Move todos between days and categories
- **Mobile-Friendly**: Responsive design with touch support
- **Auto-Migration**: Incomplete todos from past dates automatically move to current day
- **Real-time Updates**: No page refresh required

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed

### Run the Application

```bash
# Clone the repository
git clone <your-repo-url>
cd go-teuxdeux

# Start the application
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

The application will be available at `http://localhost:8080`

### Docker Commands

```bash
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f teuxdeux

# Stop the application
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Local Development

### Prerequisites
- Go 1.21+
- Node.js 18+
- SQLite3

### Development Setup

```bash
# Install dependencies
go mod download
npm install

# Build frontend
npm run build

# Start development server
make dev
```

### Available Make Commands
- `make dev` - Start development server (auto-kills existing processes, rebuilds)
- `make build` - Build the application
- `make test` - Run tests
- `make logs` - Show application logs
- `make clean` - Clean build artifacts

## API Endpoints

- `GET /api/v1/dashboard` - Complete dashboard data
- `POST /api/v1/todos` - Create new todo
- `PUT /api/v1/todos/:id` - Update todo
- `DELETE /api/v1/todos/:id` - Delete todo
- `POST /api/v1/todos/migrate` - Migrate past todos to today
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category
- `GET /api/v1/health` - Health check

## Configuration

### Environment Variables
- `PORT` - Server port (default: 8080)
- `DB_PATH` - Database file path (default: ./teuxdeux.db)
- `GIN_MODE` - Gin mode (release, debug)

### Data Persistence
- Database: SQLite file stored in `./data/teuxdeux.db` (when using Docker)
- Logs: Application logs in `./logs/` directory

## Database Schema

- **todos** - Todo items with dates, categories, completion status
- **categories** - Topic-based lists with colors
- **todo_migrations** - Migration history tracking

## Architecture

- **Backend**: Go with Gin HTTP router
- **Frontend**: React with TypeScript and Tailwind CSS
- **Database**: SQLite with foreign keys enabled
- **Build**: Vite for frontend, native Go build for backend

## Default Categories

1. Personal (#6b46c1)
2. Grocery List (#059669)
3. Restaurants (#dc2626)
4. Books to Read (#7c2d12)
5. Things to Buy (#1d4ed8)

## Mobile Features

- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Touch Drag & Drop**: Full touch support for moving todos
- **Vertical Layout**: Days stack vertically on mobile for better readability
- **Touch-Friendly**: Larger buttons and touch targets
- **PWA Ready**: Mobile web app capabilities

## License

MIT License - see LICENSE file for details