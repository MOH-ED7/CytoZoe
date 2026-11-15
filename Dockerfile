FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim-bookworm
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 CYTOZOE_REQUIRE_FRONTEND=1
COPY backend/ ./backend/
COPY scripts/ ./scripts/
COPY data/manifests/ ./data/manifests/
RUN pip install --no-cache-dir -e ./backend \
    && python scripts/fetch_data.py --all \
    && python scripts/verify_data.py --strict
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
CMD ["python", "scripts/railway_start.py"]
