# Backend Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/pyproject.toml ./
RUN pip install --no-cache-dir . || true

# Install using pip
RUN pip install \
    fastapi>=0.109.0 \
    uvicorn[standard]>=0.27.0 \
    sqlalchemy>=2.0.25 \
    asyncpg>=0.29.0 \
    alembic>=1.13.1 \
    pydantic>=2.5.3 \
    pydantic-settings>=2.1.0 \
    python-jose[cryptography]>=3.3.0 \
    passlib[bcrypt]>=1.7.4 \
    python-multipart>=0.0.6 \
    playwright>=1.41.0 \
    aiohttp>=3.9.1 \
    aiofiles>=23.2.1 \
    openpyxl>=3.1.2 \
    reportlab>=4.0.8 \
    Pillow>=10.2.0 \
    httpx>=0.26.0 \
    websockets>=12.0 \
    python-dateutil>=2.8.2 \
    email-validator>=2.1.0

# Install Playwright browsers
RUN playwright install chromium

# Copy application
COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./

# Create storage directories
RUN mkdir -p /app/storage/photos /app/storage/logs

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
