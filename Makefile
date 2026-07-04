.PHONY: install dev build run stop clean

# Installation
install:
	@echo "Installing Hata..."
	chmod +x install.sh
	./install.sh

# Development
dev-backend:
	cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

dev-db:
	docker-compose -f docker-compose.dev.yml up -d db

dev: dev-db
	@echo "Start backend and frontend in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

# Docker
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-ps:
	docker-compose ps

# Production
build: docker-build
	@echo "Building for production..."
	cd backend && pip install -e .
	cd frontend && npm run build

run: docker-up
	@echo "Application running at http://localhost"

stop: docker-down

# Database
db-migrate:
	cd backend && source venv/bin/activate && alembic upgrade head

db-reset:
	cd backend && source venv/bin/activate && alembic downgrade base && alembic upgrade head

# Clean
clean:
	rm -rf backend/__pycache__ backend/.pytest_cache backend/.mypy_cache
	rm -rf frontend/node_modules frontend/dist
	rm -rf .mypy_cache .pytest_cache
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Testing
test-backend:
	cd backend && source venv/bin/activate && pytest

test-frontend:
	cd frontend && npm run test

test: test-backend test-frontend

# Linting
lint-backend:
	cd backend && source venv/bin/activate && ruff check .

lint-frontend:
	cd frontend && npm run lint

lint: lint-backend lint-frontend
