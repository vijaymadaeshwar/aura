# Multi-Stage Build for AURA (Frontend + Backend + PostgreSQL)

# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Backend Runtime
FROM python:3.13-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Source Code
COPY backend/ ./backend/
WORKDIR /app/backend

# Copy Built Frontend Distribution to frontend/dist for unified serving
COPY --from=frontend-builder /frontend/dist /app/frontend/dist

# Expose FastAPI Web Port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8000}/api/metrics/health || exit 1

# Start Server
CMD ["python", "main.py"]
