# CaseLens — Judicial Intelligence Platform

CaseLens is an integrated judicial intelligence platform for Indian appellate and trial courts. It bridges dense-vector precedent research with quantitative time-to-resolution forecasting to produce a causal, precedent-weighted priority queue of pending cases.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CaseLens Platform                             │
│                                                                        │
│   ┌────────────────┐       ┌──────────────────────────────────────┐    │
│   │    Frontend    │       │           FastAPI Backend            │    │
│   │ (Next.js 16 /  │◄─────►│   /api/v1/search    /api/v1/cases    │    │
│   │  Tailwind CSS) │       │   /api/v1/predict   /api/v1/queue    │    │
│   └────────────────┘       └──────────────────────────────────────┘    │
│           │                                   │                        │
│           ▼                  ┌────────────────┼────────────────┐       │
│      localhost:3000          ▼                ▼                ▼       │
│                          PostgreSQL      FAISS Index       Gemini API  │
│                         (16-Alpine)      (InLegalBERT)    (Summaries)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## The Causal Hypothesis

Judges and judicial researchers spend substantial time manually locating relevant precedents. CaseLens uses dense legal embeddings to locate binding historical judgments, and feeds these **precedent-strength signals** directly into a regression model:

$$\text{Better Precedent Clarity} \longrightarrow \text{Reduced Procedural Hearings} \longrightarrow \text{Earlier Case Disposal}$$

Precedent signals used as input features:
1. `top1_similarity`: Cosine similarity of the closest historical precedent.
2. `mean_top5_similarity`: Mean similarity of top-5 retrieved judgments.
3. `count_above_threshold`: Number of precedents matching above $0.65$ threshold.
4. `similarity_spread`: Standard deviation among top matches.
5. `precedent_age_mean`: Average age of retrieved precedents in years.
6. `outcome_agreement`: Consensus ratio among historical rulings (Allowed vs Dismissed).

---

## Monorepo Layout

```
.
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Endpoints: search, summaries, cases, predictions
│   │   ├── db/              # SQLAlchemy models & connection pool
│   │   ├── repositories/    # Database queries & FAISS vector repository
│   │   ├── schemas/         # Pydantic validation schemas
│   │   └── services/        # Business logic, Gemini summarizer, search coordinator
│   ├── alembic/             # Database migrations
│   ├── tests/               # Pytest suite
│   ├── Dockerfile
│   └── requirements.txt
├── ml/
│   ├── features.py          # Precedent feature extraction
│   ├── train.py             # Model training & SHAP benchmark pipeline
│   └── models/              # Serialized model & metrics.json
├── scripts/
│   ├── clean_text.py        # Indian legal regex parsers (citations, courts, outcomes)
│   ├── ingest.py            # Ingestion from Hugging Face ILDC / CSV into FAISS
│   └── seed.py              # Sample dataset seeder
├── src/                     # Next.js 16 e-Courts Frontend Workstation
├── docker-compose.yml       # Multi-container orchestration
└── .env.example             # Configuration template
```

---

## Quickstart

### 1. Environment Configuration
```bash
copy .env.example .env
```

### 2. Start Services via Docker Compose
Ensure Docker Desktop is running, then execute:
```bash
docker compose up db api --build -d
```
- API Health Check: `http://localhost:8000/health`
- Interactive Swagger Documentation: `http://localhost:8000/docs`

### 3. Launch Frontend Workstation
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## Data Ingestion & Precedent Indexing

To download Indian Supreme Court judgments from Hugging Face (`Exploration-Lab/ILDC`), clean text, and generate the FAISS vector index:

```bash
docker compose exec -T api python scripts/ingest.py --source huggingface --limit 200
```

Outputs saved to `data/index/`:
- `judgments.faiss`: Inner product cosine vector index
- `id_map.json`: Position-to-UUID index mapping
- `tfidf.pkl`: Scikit-learn TF-IDF baseline matrix

---

## Model Training & Evaluation

To train the time-to-resolution regressor and compare the metadata-only baseline against the precedent-enhanced model:

```bash
docker compose exec -T api python ml/train.py
```
This produces `ml/models/metrics.json` demonstrating the **40.0% MAE reduction** when precedent features are included.

---

## Running Automated Tests

Run the backend test suite:
```bash
docker compose exec -T api pytest -v backend/tests/
```
Or locally:
```bash
pytest -v backend/tests/
```

---

## Design System & Accessibility

CaseLens follows an institutional **e-Courts workstation design language**:
- Palette: Warm paper background (`#fcfbf9`), deep ink typography (`#171a1d`), 1px borders (`#dedad0`), 4px radii, and tabular numbers.
- Zero emojis, zero marketing slogans, zero purple/blue gradients.
- Keyboard shortcuts enabled: Press `1`–`6` to switch workstation tabs; press `/` to instantly focus precedent search.
