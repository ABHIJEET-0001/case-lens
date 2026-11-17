FROM python:3.11-slim

WORKDIR /app

# Install system deps needed by psycopg2 and other packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (cached layers)
# Pre-install CPU-only PyTorch first so it's cached and doesn't pull ~3GB of CUDA wheels
RUN pip install --no-cache-dir --default-timeout=1000 --retries=10 torch --index-url https://download.pytorch.org/whl/cpu
COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=1000 --retries=10 -r requirements.txt

# Copy application source
COPY . .

# Create data directories for FAISS index and model artifacts
RUN mkdir -p /app/data/index /app/data/models

# entrypoint: run migrations, then start the server using dynamic PORT from cloud provider
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
