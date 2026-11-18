"""
app/db/seed.py
──────────────
Seeds demo users (clerk / researcher / judge) only when DEMO_MODE=true.
Run once at startup via main.py.
"""
import logging
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from datetime import date, datetime, timezone
import json
from app.db.models import User, UserRole, PendingCase, CaseStatus, ComplexityClass
from app.config import settings

log = logging.getLogger("seed")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_USERS = [
    {
        "email": "clerk@ecourts.gov.in",
        "password": "demo123",
        "full_name": "Rajesh Verma (Court Clerk)",
        "role": UserRole.clerk,
    },
    {
        "email": "researcher@ecourts.gov.in",
        "password": "demo123",
        "full_name": "Pooja Iyer (Law Researcher)",
        "role": UserRole.researcher,
    },
    {
        "email": "judge@ecourts.gov.in",
        "password": "demo123",
        "full_name": "Justice K. Sharma (Presiding Judge)",
        "role": UserRole.judge,
    },
]

DEMO_CASES = [
    {"case_no": "CRL.A. 102/2024", "case_type": "CRL.A", "court": "Supreme Court of India", "filing_date": date(2024, 1, 15), "hearings": 12, "desc": "Bail petition concerning Section 45 PMLA twin conditions vs Article 21 speedy trial rights."},
    {"case_no": "CRL.A. 145/2024", "case_type": "CRL.A", "court": "High Court of Delhi", "filing_date": date(2024, 2, 10), "hearings": 8, "desc": "Anticipatory bail plea in commercial cheating under Section 420/406 IPC."},
    {"case_no": "WP(C) 521/2023", "case_type": "WP", "court": "Supreme Court of India", "filing_date": date(2023, 7, 22), "hearings": 21, "desc": "Writ petition challenging retrospective statutory amendment affecting tender awards."},
    {"case_no": "ARB.P. 88/2024", "case_type": "ARB", "court": "High Court of Bombay", "filing_date": date(2024, 3, 5), "hearings": 4, "desc": "Section 34 challenge to arbitral award on grounds of patent illegality and public policy."},
    {"case_no": "CRL.M.C. 304/2023", "case_type": "CRL", "court": "High Court of Delhi", "filing_date": date(2023, 11, 14), "hearings": 15, "desc": "Quashing petition under Section 482 CrPC for settlement between matrimonial parties."},
    {"case_no": "CIV.A. 712/2022", "case_type": "CIV", "court": "Supreme Court of India", "filing_date": date(2022, 9, 30), "hearings": 29, "desc": "Regular civil appeal regarding title dispute and adverse possession over ancestral estate."},
    {"case_no": "CRL.A. 210/2024", "case_type": "CRL.A", "court": "High Court of Bombay", "filing_date": date(2024, 2, 28), "hearings": 6, "desc": "Appeal against conviction under Section 302/34 IPC relying on circumstantial chain evidence."},
    {"case_no": "WP(CRL) 95/2024", "case_type": "WP", "court": "Supreme Court of India", "filing_date": date(2024, 4, 2), "hearings": 3, "desc": "Habeas corpus petition alleging non-compliance with Section 41A CrPC procedural guidelines."},
    {"case_no": "COM.AP. 18/2023", "case_type": "COM", "court": "High Court of Delhi", "filing_date": date(2023, 6, 18), "hearings": 16, "desc": "Commercial dispute concerning bank guarantee invocation amidst corporate insolvency."},
    {"case_no": "SLP(C) 1402/2024", "case_type": "SLP", "court": "Supreme Court of India", "filing_date": date(2024, 1, 9), "hearings": 11, "desc": "Special leave petition regarding jurisdiction of tribunal under consumer protection provisions."},
    {"case_no": "CRL.REV. 62/2024", "case_type": "CRL", "court": "High Court of Delhi", "filing_date": date(2024, 3, 19), "hearings": 5, "desc": "Revision petition against discharge order in disproportionate assets prosecution."},
    {"case_no": "TAX.AP. 441/2023", "case_type": "TAX", "court": "High Court of Bombay", "filing_date": date(2023, 8, 25), "hearings": 14, "desc": "Income tax reassessment notice validity challenged beyond limitation window."},
    {"case_no": "CIV.REV. 109/2024", "case_type": "CIV", "court": "High Court of Delhi", "filing_date": date(2024, 2, 1), "hearings": 7, "desc": "Revisional challenge against interim injunction in trademark infringement suit."},
    {"case_no": "CRL.A. 330/2023", "case_type": "CRL.A", "court": "Supreme Court of India", "filing_date": date(2023, 10, 8), "hearings": 19, "desc": "Criminal appeal regarding NDPS conscious possession and search warrant procedural defects."},
    {"case_no": "WP(C) 1102/2023", "case_type": "WP", "court": "High Court of Bombay", "filing_date": date(2023, 5, 12), "hearings": 24, "desc": "Environmental clearance dispute regarding urban coastal road infrastructure project."}
]


def seed_demo_users(db: Session) -> None:
    """Insert demo users only if DEMO_MODE=true and the user does not already exist."""
    if not settings.demo_mode:
        return
    for u in DEMO_USERS:
        exists = db.query(User).filter(User.email == u["email"]).first()
        if not exists:
            db.add(
                User(
                    email=u["email"],
                    hashed_password=pwd_context.hash(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                )
            )
            log.info("Seeded demo user: %s (%s)", u["email"], u["role"].value)
    db.commit()


def seed_demo_cases(db: Session) -> None:
    """Insert 15 fictional pending cases only if DEMO_MODE=true and the table is empty.
    Computes precedent features when the FAISS index is ready; otherwise logs a warning.
    """
    if not settings.demo_mode:
        return
    # Skip if pending cases already exist
    if db.query(PendingCase).count() > 0:
        log.info("Pending cases already exist – skipping demo case seeding")
        return
    from app.repositories.vector_index_repo import VectorIndexRepository
    vector_repo = VectorIndexRepository.get_instance()
    if not vector_repo.is_ready:
        log.warning("FAISS index not ready – seeding demo cases without similarity features")


    from app.repositories.vector_index_repo import VectorIndexRepository
    vector_repo = VectorIndexRepository.get_instance()

    for idx, c in enumerate(DEMO_CASES, start=1):
        exists = db.query(PendingCase).filter(PendingCase.case_no == c["case_no"]).first()
        if exists:
            continue

        # Compute real precedent features if vector repo is ready
        top1_sim = 0.72
        mean_top5 = 0.65
        count_above = 3
        if vector_repo.is_ready:
            matches = vector_repo.search_semantic(c["desc"], top_k=5)
            if matches:
                scores = [m[1] for m in matches]
                top1_sim = float(scores[0])
                mean_top5 = float(sum(scores) / len(scores))
                count_above = sum(1 for s in scores if s > 0.60)

        # Causal delay prediction based on precedent strength & hearings
        pred_days = max(30.0, 180.0 + (c["hearings"] * 15.0) - (top1_sim * 160.0))
        priority = min(98.0, max(45.0, 50.0 + (top1_sim * 35.0) + (c["hearings"] * 0.8)))
        complexity = ComplexityClass.high if c["hearings"] > 18 else ComplexityClass.medium if c["hearings"] > 8 else ComplexityClass.low

        shap_factors = [
            {
                "feature": "Precedent Similarity",
                "impact": "reduces_delay" if top1_sim > 0.65 else "increases_delay",
                "impact_days": round(-25.0 * top1_sim, 1),
                "plain_english_reason": f"Top precedent matches core legal doctrine at {round(top1_sim * 100)}% similarity."
            },
            {
                "feature": "Hearing Trajectory",
                "impact": "increases_delay" if c["hearings"] > 10 else "reduces_delay",
                "impact_days": round(c["hearings"] * 4.2, 1),
                "plain_english_reason": f"Accumulated {c['hearings']} docket hearings."
            }
        ]

        case_obj = PendingCase(
            case_no=c["case_no"],
            case_type=c["case_type"],
            court=c["court"],
            filing_date=c["filing_date"],
            hearings_count=c["hearings"],
            description=c["desc"],
            status=CaseStatus.pending if idx > 4 else CaseStatus.hearing,
            top1_similarity=round(top1_sim, 4),
            mean_top5_similarity=round(mean_top5, 4),
            count_above_threshold=count_above,
            similarity_spread=0.06,
            precedent_age_mean=3.2,
            outcome_agreement=0.85,
            predicted_days=round(pred_days, 1),
            complexity=complexity,
            priority_score=round(priority, 1),
            shap_reasons=json.dumps(shap_factors),
            prediction_updated_at=datetime.now(timezone.utc),
        )
        db.add(case_obj)
        log.info("Seeded demo case: %s", c["case_no"])

    db.commit()


def seed_all(db: Session) -> None:
    """Run all demo seeding, but never raise on failure."""
    try:
        seed_demo_users(db)
        seed_demo_cases(db)
    except Exception as e:
        log.error("Seeding error: %s", e)

