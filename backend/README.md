# Hata Backend

Backend API for Hata - Real Estate Parser and Visualization System.

## Features

- FastAPI REST API
- PostgreSQL database with SQLAlchemy ORM
- JWT authentication
- Playwright-based property parser
- Excel and PDF export

## Installation

```bash
python3 -m venv venv
source venv/bin/activate
pip install -e .
```

## Running

```bash
uvicorn app.main:app --reload
```

## API Documentation

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
