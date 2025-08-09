# Multi-stage build for TeuxDeux Clone
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build frontend
COPY . .
RUN npm run build

# Go backend build stage - Use Ubuntu for better SQLite support
FROM golang:1.21-bookworm AS backend-builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libc6-dev \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the Go application
ENV CGO_ENABLED=1
RUN go build -ldflags "-s -w" -o teuxdeux-clone ./cmd/main.go

# Final stage - Use Ubuntu for runtime compatibility
FROM ubuntu:22.04

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    sqlite3 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p /app/static/dist/assets
RUN mkdir -p /app/logs

# Copy built application
COPY --from=backend-builder /app/teuxdeux-clone .

# Copy built frontend assets
COPY --from=frontend-builder /app/static/dist ./static/dist

# Create a non-root user
RUN groupadd -g 1001 appgroup && \
    useradd -r -u 1001 -g appgroup -d /app -s /sbin/nologin appuser

# Change ownership of app directory
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

# Run the application
CMD ["./teuxdeux-clone"]