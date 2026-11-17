# CaseLens — Judicial Intelligence & Resolution Platform

> **Notice**: Decision-support tool for court administration and legal researchers. Not legal advice or a judicial determination. Time-to-resolution labels are synthetic and calibrated to aggregate NJDG parameters.

CaseLens is a full-stack platform combining dense precedent vector retrieval (FAISS + MiniLM 384d), cross-statute query expansion (IPC ↔ BNS, CrPC ↔ BNSS), and gradient-boosted time-to-resolution forecasting with SHAP explanations.

---

## 5-Minute Local Setup

### Prerequisites
- Node.js 20+ & npm
- Python 3.11+
- Docker & Docker Compose (optional for database)

### 1. Environment Configuration
```bash
cp .env.example .env
```
Fill in `DATABASE_URL` (defaults to local PostgreSQL) and your `GEMINI_API_KEY` (from Google AI Studio).

### 2. Run Database & Backend
```bash
# Using Docker:
docker compose up -d db
docker compose up --build api

# Or manually:
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Ingest Sample Judgments & Build FAISS Index
```bash
python scripts/ingest.py --source huggingface --model minilm --limit 200
```

### 4. Run Frontend
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the judicial workstation.

---

## Deployment on Render

CaseLens is pre-configured with `render.yaml` for a three-service deployment:
1. **Web Service (`caselens-api`)**: Fast, containerized FastAPI backend.
2. **Web Service (`caselens-web`)**: Next.js static / server frontend.
3. **Managed PostgreSQL (`caselens-postgres`)**: Scalable relational database.

Refer to `docs/data_sources.md` and `docs/model_card.md` for methodology and model evaluation.
