# CaseLens — Architecture Notes

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CaseLens Platform                         │
│                                                                   │
│  ┌──────────────┐    ┌──────────────────────────────────────┐   │
│  │   Frontend   │    │              FastAPI Backend           │   │
│  │  React+Vite  │◄──►│  /api/search  /api/cases  /api/queue │   │
│  └──────────────┘    └──────────────────────────────────────┘   │
│                                │                                  │
│              ┌─────────────────┼──────────────────┐             │
│              ▼                 ▼                   ▼             │
│         PostgreSQL          FAISS Index       Gemini API         │
│       (metadata +         (judgment           (summaries)        │
│        summaries)          embeddings)                           │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Ingest** (`scripts/ingest.py`): Load judgments from ILDC/IN-Abs CSV → clean → store in `judgments` table → embed with InLegalBERT → store in FAISS.
2. **Search** (`POST /api/search`): Embed query → FAISS ANN search → fetch metadata → return ranked results with similarity scores.
3. **Summarise** (`GET /api/judgments/{id}/summary`): Check `summaries` cache → if miss, call Gemini API with structured prompt → store result.
4. **Predict** (`POST /api/cases/{id}/predict`): Compute precedent-strength features from search results → run XGBoost model → store output + SHAP reasons.
5. **Queue** (`POST /api/queue/rank`): Fetch all pending cases with predictions → sort by priority_score → return ranked list.

## Database Tables

| Table | Purpose |
|---|---|
| `users` | Auth — Clerk / Researcher / Judge |
| `judgments` | Ingested court judgments (text + metadata) |
| `summaries` | Cached structured summaries per judgment |
| `pending_cases` | Live cases + precedent features + prediction output |

## Directories

```
/backend    FastAPI app, Alembic migrations, tests
/frontend   React + Vite app (Step 6)
/ml         Training script, feature engineering, evaluation
/scripts    Ingest, seed, optional scraper
/docs       This file and API reference
```
