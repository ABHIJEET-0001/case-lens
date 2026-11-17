.PHONY: dev test test-backend test-frontend seed ingest lint

# Run development servers locally
dev:
	@echo "Starting backend and frontend..."
	docker compose up

# Run test suites
test: test-backend test-frontend

test-backend:
	pytest backend/tests/ -v

test-frontend:
	npm run build

# Code linting
lint:
	ruff check backend/
	npx eslint src/

# Database initialization & seeding
seed:
	python backend/scripts/seed.py

# Ingest 200 judgments from ILDC
ingest:
	python scripts/ingest.py --source huggingface --model minilm --limit 200
