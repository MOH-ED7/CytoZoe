# Stage 1: Build the React frontend
FROM node:22-bookworm-slim AS frontend-build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci --no-audit --no-fund

COPY frontend/ ./frontend/
RUN cd frontend && npm run build


# Stage 2: Run the Python FastAPI backend
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY backend/ ./backend/
RUN pip install --no-cache-dir ./backend

COPY scripts/ ./scripts/
COPY data/ ./data/

COPY --from=frontend-build /app/frontend/dist ./frontend/dist

RUN mkdir -p /app/runtime

# Railway assigns its own port
CMD ["sh", "-c", "exec uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port ${PORT:-8000}"]
