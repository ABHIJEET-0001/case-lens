FROM python:3.11-slim

WORKDIR /app

# Install system deps needed by psycopg2 and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --default-timeout=1000 -r requirements.txt

# Pre-download fastembed model at build time so first startup does not time out
RUN python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='sentence-transformers/all-MiniLM-L6-v2')"

# Copy application source, ml artifacts and scripts into the image
COPY backend/ /app/
COPY ml/ /app/ml/
COPY scripts/ /app/scripts/

# Ensure data directories exist and populate index if present
RUN mkdir -p /app/data/index /app/data/models && \
    if [ -d /app/data/index ] && [ -f /app/data/index/judgments.faiss ]; then echo 'Index already in /app/data/index'; \
    elif [ -d /app/backend/data/index ]; then cp -r /app/backend/data/index/* /app/data/index/ 2>/dev/null || true; fi

ENV PYTHONPATH=/app
ENV INDEX_DIR=/app/data/index

# Entrypoint: migrate DB, seed demo data if DEMO_MODE=true, then start uvicorn
CMD ["sh", "-c", "alembic upgrade head && python -c 'from app.db.session import SessionLocal; from app.db.seed import seed_all; db=SessionLocal(); seed_all(db); db.close()' || true && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
