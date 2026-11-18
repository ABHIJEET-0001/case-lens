.PHONY: dev-backend dev-frontend lint check

# Run FastAPI backend locally (requires .venv with Python 3.11)
dev-backend:
	.venv\Scripts\uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

# Run Next.js frontend locally
dev-frontend:
	npm run dev

# Type-check + lint
check:
	npx tsc --noEmit
	npx eslint src/

# Code linting only
lint:
	ruff check backend/
	npx eslint src/

# Database seeding (requires running PostgreSQL)
seed:
	python scripts/seed.py

# Ingest judgments from ILDC dataset
ingest:
	python scripts/ingest.py --source huggingface --model minilm --limit 200
