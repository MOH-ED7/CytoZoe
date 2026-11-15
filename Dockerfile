# Stage 1: Build the React + Vite frontend
FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python FastAPI backend + NASA data setup
FROM python:3.12-slim
WORKDIR /app

# Copy backend, scripts, and data manifests
COPY backend/ ./backend/
COPY scripts/ ./scripts/
COPY data/ ./data/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Install Python backend dependencies and download/verify NASA CSVs
RUN pip install --no-cache-dir -e "./backend" \
    && python scripts/fetch_data.py --all \
    && python scripts/verify_data.py --strict

ENV CYTOZOE_REQUIRE_FRONTEND=1

# Import NASA data into runtime SQLite DB on startup and start Uvicorn on $PORT
CMD ["sh", "-c", "python scripts/import_data.py --all && uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port ${PORT:-8000}"]
