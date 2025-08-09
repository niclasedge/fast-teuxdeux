.PHONY: dev logs build test clean deps kill-process watch

# Variables
APP_NAME := teuxdeux-clone
BINARY_PATH := ./$(APP_NAME)
PID_FILE := ./logs/$(APP_NAME).pid
LOG_FILE := ./logs/$(APP_NAME).log
PORT := 8080

# Default target
all: build

# Install dependencies
deps:
	@echo "Installing dependencies..."
	go mod download
	go mod tidy

# Build the application
build: deps
	@echo "Building application..."
	go build -o $(BINARY_PATH) ./cmd/main.go

# Kill any running process by name
kill-process:
	@echo "Killing any running $(APP_NAME) processes..."
	@pkill -f "$(APP_NAME)" || true
	@if [ -f $(PID_FILE) ]; then \
		PID=$$(cat $(PID_FILE)); \
		if ps -p $$PID > /dev/null 2>&1; then \
			kill $$PID || true; \
			echo "Killed process with PID $$PID"; \
		fi; \
		rm -f $(PID_FILE); \
	fi
	@sleep 1

# Clean old cached files and build artifacts
clean: kill-process
	@echo "Cleaning old cached files..."
	@rm -f $(BINARY_PATH)
	@rm -rf ./tmp
	@go clean -cache
	@mkdir -p logs

# Watch for file changes and restart server
watch:
	@echo "Starting file watcher..."
	@if command -v fswatch >/dev/null 2>&1; then \
		fswatch -o . --exclude=logs --exclude=.git --exclude=tmp | while read num; do \
			echo "Files changed, restarting server..."; \
			$(MAKE) dev; \
		done; \
	elif command -v inotifywait >/dev/null 2>&1; then \
		while inotifywait -r -e modify,create,delete --exclude='logs|\.git|tmp' .; do \
			echo "Files changed, restarting server..."; \
			$(MAKE) dev; \
		done; \
	else \
		echo "Neither fswatch nor inotifywait found. Install one for auto-restart."; \
		echo "On macOS: brew install fswatch"; \
		echo "On Linux: sudo apt-get install inotify-tools"; \
		exit 1; \
	fi

# Development server with auto-restart
dev: kill-process clean build
	@echo "Starting development server on port $(PORT)..."
	@mkdir -p logs
	@echo "Starting $(APP_NAME) at $$(date)" >> $(LOG_FILE)
	@nohup $(BINARY_PATH) >> $(LOG_FILE) 2>&1 & \
		echo $$! > $(PID_FILE) && \
		echo "Server started with PID $$(cat $(PID_FILE))"
	@echo "Server is running on http://localhost:$(PORT)"
	@echo "Use 'make logs' to view logs"
	@echo "Use 'make kill-process' to stop the server"

# Development server that preserves data (no cache cleaning)
dev-preserve: kill-process build
	@echo "Starting development server on port $(PORT) (preserving data)..."
	@mkdir -p logs
	@echo "Starting $(APP_NAME) at $$(date)" >> $(LOG_FILE)
	@nohup $(BINARY_PATH) >> $(LOG_FILE) 2>&1 & \
		echo $$! > $(PID_FILE) && \
		echo "Server started with PID $$(cat $(PID_FILE))"
	@echo "Server is running on http://localhost:$(PORT)"
	@echo "Use 'make logs' to view logs"
	@echo "Use 'make kill-process' to stop the server"

# Start with file watching for auto-restart on changes
dev-watch: 
	@echo "Starting development server with file watching..."
	@$(MAKE) watch

# Show the last 100 lines of logs from the current running service
logs:
	@if [ -f $(LOG_FILE) ]; then \
		echo "=== Last 100 lines of $(APP_NAME) logs ==="; \
		tail -100 $(LOG_FILE); \
		echo "=== End of logs ==="; \
		echo "Use 'tail -f $(LOG_FILE)' to follow logs in real-time"; \
	else \
		echo "Log file not found. Is the server running?"; \
		echo "Start the server with 'make dev'"; \
	fi

# Follow logs in real-time
logs-follow:
	@if [ -f $(LOG_FILE) ]; then \
		echo "Following logs in real-time (Ctrl+C to stop)..."; \
		tail -f $(LOG_FILE); \
	else \
		echo "Log file not found. Is the server running?"; \
	fi

# Check server status
status:
	@if [ -f $(PID_FILE) ]; then \
		PID=$$(cat $(PID_FILE)); \
		if ps -p $$PID > /dev/null 2>&1; then \
			echo "Server is running with PID $$PID"; \
			echo "Server started: $$(ps -p $$PID -o lstart=)"; \
		else \
			echo "Server is not running (stale PID file)"; \
			rm -f $(PID_FILE); \
		fi; \
	else \
		echo "Server is not running"; \
	fi

# Run tests
test:
	@echo "Running tests..."
	go test -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Database operations
db-reset:
	@echo "Resetting database..."
	@rm -f ./teuxdeux.db
	@echo "Database reset complete"

# Help
help:
	@echo "Available commands:"
	@echo "  make dev          - Start development server (kills any running process, cleans cache, builds and starts)"
	@echo "  make dev-preserve - Start development server preserving database data (no cache cleaning)"
	@echo "  make dev-watch    - Start development server with auto-restart on file changes"
	@echo "  make logs         - Show last 100 lines of server logs"
	@echo "  make logs-follow  - Follow server logs in real-time"
	@echo "  make status       - Check if server is running"
	@echo "  make kill-process - Kill any running server process"
	@echo "  make build        - Build the application"
	@echo "  make clean        - Clean build artifacts and cache"
	@echo "  make test         - Run tests"
	@echo "  make test-coverage- Run tests with coverage report"
	@echo "  make db-reset     - Reset the database"
	@echo "  make deps         - Install/update dependencies"
	@echo "  make help         - Show this help"