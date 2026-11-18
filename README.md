# CaseLens — Judicial Intelligence & Resolution Platform

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791?logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Language-Python%203.11-3776AB?logo=python)](https://www.python.org/)

> **Institutional Notice**: Decision-support tool for court administration and legal researchers. Not legal advice or a judicial determination. Time-to-resolution labels are synthetic and calibrated to aggregate National Judicial Data Grid (NJDG) parameters.

CaseLens is an institutional judicial analytics workstation combining **dense precedent vector retrieval** (FAISS + MiniLM), **cross-statute query expansion** (IPC ↔ BNS, CrPC ↔ BNSS), and **gradient-boosted time-to-resolution forecasting** with transparent **SHAP feature explainability**.

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Next.js 16 (App Router)             │
│   Judicial Dashboard • Case Register • Dossier • SHAP  │
└──────────────────────────┬─────────────────────────────┘
                           │ (HTTP / Rewrites / REST)
┌──────────────────────────▼─────────────────────────────┐
│                   FastAPI Backend Service              │
│  • Precedent Search API (Hybrid: FAISS + BM25)         │
│  • Case Prioritization & Resolution Forecaster         │
│  • Cross-Statutory Query Expander (IPC ↔ BNS)          │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌──────────────────┐               ┌──────────────────┐
│  PostgreSQL 16   │               │   FAISS Index    │
│ judgments_dump   │               │ judgments.faiss  │
│ 13.6 MB records  │               │   384d Vectors   │
└──────────────────┘               └──────────────────┘
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- **Node.js** 20+ & **npm**
- **Python** 3.11
- **PostgreSQL** 16 *(optional: frontend includes rich offline demo fallback)*

---

### 2. Frontend Setup (Next.js)

```powershell
# Install Node dependencies
npm install

# Start development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.  
The application boots straight into the **Judicial Intelligence Dashboard** authenticated as *Justice K. Sharma (Presiding Judge)*.

---

### 3. Backend Setup (FastAPI)

```powershell
# Activate Python 3.11 virtual environment
.\.venv\Scripts\Activate.ps1

# Set python path and launch FastAPI
$env:PYTHONPATH="backend"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API Base URL: `http://localhost:8000`
- Interactive Swagger Documentation: **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

### 4. Database Setup (PostgreSQL)

CaseLens comes with a pre-compiled dataset dump: **`judgments_dump.sql` (13.6 MB)** containing hundreds of full-text Supreme Court and High Court judgments.

To restore into your local PostgreSQL instance:
```powershell
# Create database and restore dump
psql -U postgres -c "CREATE DATABASE caselens_db;"
psql -U postgres -d caselens_db -f judgments_dump.sql
```

Update your `.env` configuration:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/caselens_db
```

---

## 📁 Repository Structure

```text
Case Lens/
├── backend/
│   ├── alembic/              # Database migration version scripts
│   ├── app/
│   │   ├── api/v1/           # API endpoints (cases, search, predictions, health)
│   │   ├── db/               # SQLAlchemy models and session management
│   │   ├── repositories/     # Database access layer
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Machine learning and search logic
│   │   ├── config.py         # App configuration & settings
│   │   └── main.py           # FastAPI entrypoint
│   └── requirements.txt      # Pinned Python 3.11 dependencies
├── docs/                     # Technical documentation & methodology
│   ├── architecture.md       # Full stack design overview
│   ├── data_sources.md       # ILDC corpus details
│   ├── label_methodology.md  # Disposal time calculation methodology
│   └── model_card.md         # Model benchmark cards & metrics
├── ml/                       # ML pipelines & evaluation scripts
├── public/                   # Static web assets
├── scripts/
│   ├── clean_text.py         # Judgment text normalizer
│   ├── ingest.py             # Ingestion & embedding pipeline
│   └── seed.py               # Demo docket seeder
├── src/
│   ├── app/                  # Next.js App Router (page.tsx, layout.tsx)
│   ├── components/           # UI components & view workspaces
│   │   └── views/            # Dashboard, Cases, Research, Queue, ModelReport
│   └── lib/                  # TypeScript types, API client, fallback data
├── judgments_dump.sql        # 13.6 MB PostgreSQL database dump
├── Makefile                  # Developer CLI shortcuts
├── package.json              # Frontend manifest
└── tsconfig.json             # TypeScript configuration
```

---

## 🔬 Core Capabilities

1. **Precedent Intelligence:**
   - Real-time semantic search combining dense vector embeddings (FAISS) and sparse keyword scoring (BM25/TF-IDF).
   - Instant landmark case matching (*Manish Sisodia*, *Vijay Madanlal Choudhary*, *Arnesh Kumar*).

2. **Resolution Forecasting & SHAP Explainability:**
   - Gradient-boosted model predicting estimated days to case disposal with confidence intervals.
   - Transparent SHAP feature attribution explaining which legal factors accelerate or delay resolution.

3. **Statutory Awareness:**
   - Seamless cross-statute translation between legacy codes and modern enactments (IPC ↔ BNS, CrPC ↔ BNSS).
