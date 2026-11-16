"""
scripts/seed.py
───────────────
Populates the database with realistic sample Indian judgments and pending cases.
Useful for local demonstration, unit tests, and staging verification.

Usage:
  python scripts/seed.py
"""
import sys
import os
import uuid
from datetime import date, datetime
from pathlib import Path

# Add backend directory and repo root to path
_REPO_ROOT = Path(__file__).resolve().parent.parent
_BACKEND = _REPO_ROOT / "backend"
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from app.db.session import SessionLocal
from app.db.models import Judgment, Summary, PendingCase, User, UserRole, CaseStatus, ComplexityClass


def seed_database():
    db = SessionLocal()
    print("Seeding CaseLens database with authentic Indian legal records...")

    try:
        # 1. Users
        if not db.query(User).filter_by(email="clerk@ecourts.gov.in").first():
            clerk = User(
                id=uuid.uuid4(),
                email="clerk@ecourts.gov.in",
                hashed_password="demo_hashed_password",
                full_name="Rajesh Verma (Court Clerk)",
                role=UserRole.clerk,
            )
            db.add(clerk)
        if not db.query(User).filter_by(email="justice.sharma@sci.gov.in").first():
            judge = User(
                id=uuid.uuid4(),
                email="justice.sharma@sci.gov.in",
                hashed_password="demo_hashed_password",
                full_name="Justice K. Sharma (Presiding Judge)",
                role=UserRole.judge,
            )
            db.add(judge)
        db.commit()

        # 2. Judgments & Summaries
        j1 = db.query(Judgment).filter_by(citation="(2022) 10 SCC 1").first()
        if not j1:
            j1 = Judgment(
                id=uuid.uuid4(),
                title="Vijay Madanlal Choudhary & Ors vs Union of India & Ors",
                citation="(2022) 10 SCC 1",
                court="Supreme Court of India",
                case_type="CRL.A",
                bench="A.M. Khanwilkar, Dinesh Maheshwari, C.T. Ravikumar, JJ.",
                judgment_date=date(2022, 7, 27),
                outcome="Dismissed",
                source_url="https://main.sci.gov.in/judgments",
                full_text=(
                    "IN THE SUPREME COURT OF INDIA\nCRIMINAL APPELLATE JURISDICTION\n\n"
                    "CRIMINAL APPEAL NO. 4634 OF 2014\n\n"
                    "VIJAY MADANLAL CHOUDHARY ...APPELLANT\nVERSUS\nUNION OF INDIA ...RESPONDENT\n\n"
                    "JUDGMENT\n\n"
                    "1. The seminal question involved in this batch of cases is regarding the constitutional validity "
                    "of the provisions of the Prevention of Money Laundering Act, 2002. "
                    "2. Broadly, the challenge relates to the twin conditions under Section 45. "
                    "3. We hold that Section 45 satisfies the test of proportionality and is constitutional and valid."
                ),
                word_count=18450,
                is_indexed=True,
            )
            db.add(j1)
            db.commit()

        if not db.query(Summary).filter_by(judgment_id=j1.id).first():
            s1 = Summary(
                judgment_id=j1.id,
                facts="Special Leave Petitions challenging constitutional validity of Section 45(1) twin conditions under PMLA.",
                issue="Whether Section 45(1) PMLA bail preconditions are unconstitutional post-2018 amendment.",
                holding="Section 45 satisfies constitutional proportionality; money laundering is a grave socio-economic offence.",
                outcome_text="All challenges dismissed; statutory validity reaffirmed.",
                model_used="gemini-1.5-flash",
            )
            db.add(s1)
            db.commit()

        j2 = db.query(Judgment).filter_by(citation="2024 INSC 595").first()
        if not j2:
            j2 = Judgment(
                id=uuid.uuid4(),
                title="Manish Sisodia vs Directorate of Enforcement",
                citation="2024 INSC 595",
                court="Supreme Court of India",
                case_type="CRL.A",
                bench="B.R. Gavai, K.V. Viswanathan, JJ.",
                judgment_date=date(2024, 8, 9),
                outcome="Allowed",
                source_url="https://main.sci.gov.in/judgments",
                full_text=(
                    "IN THE SUPREME COURT OF INDIA\nCRIMINAL APPELLATE JURISDICTION\n\n"
                    "CRIMINAL APPEAL NO. 3295 OF 2024\n\n"
                    "MANISH SISODIA ...APPELLANT\nVERSUS\nDIRECTORATE OF ENFORCEMENT ...RESPONDENT\n\n"
                    "JUDGMENT\n\n"
                    "1. The appellant has been incarcerated for a period of 17 months with 493 witnesses. "
                    "2. Prolonged incarceration without trial infringes the fundamental right under Article 21. "
                    "Section 45 PMLA cannot extinguish constitutional protections."
                ),
                word_count=9240,
                is_indexed=True,
            )
            db.add(j2)
            db.commit()

        if not db.query(Summary).filter_by(judgment_id=j2.id).first():
            s2 = Summary(
                judgment_id=j2.id,
                facts="Regular bail appeal in Delhi excise policy case after 17 months incarceration without commencement of trial.",
                issue="Whether prolonged custody without trial conclusion overrides statutory twin conditions under Section 45 PMLA.",
                holding="Article 21 right to speedy trial overrides statutory bail restrictions where trial cannot conclude within reasonable time.",
                outcome_text="Appeals allowed; appellant directed to be released on regular bail.",
                model_used="gemini-1.5-flash",
            )
            db.add(s2)
            db.commit()

        # 3. Pending Cases
        if not db.query(PendingCase).filter_by(case_no="CRL.A. 1421/2023").first():
            c1 = PendingCase(
                case_no="CRL.A. 1421/2023",
                case_type="CRL.A",
                court="Supreme Court of India",
                filing_date=date(2023, 4, 12),
                hearings_count=14,
                status=CaseStatus.hearing,
                description="Regular bail appeal in alleged mining concession money-laundering case. Appellant in custody for 21 months with 128 witnesses. Invokes Article 21 speedy trial protections in light of Manish Sisodia precedent.",
                top1_similarity=0.884,
                mean_top5_similarity=0.812,
                count_above_threshold=4,
                similarity_spread=0.038,
                precedent_age_mean=2.1,
                outcome_agreement=0.8,
                predicted_days=78.0,
                complexity=ComplexityClass.medium,
                priority_score=84.5,
                shap_reasons='[{"feature":"Precedent Strength (0.884)","impact":"reduces_delay","impact_days":-52.0,"plain_english_reason":"Binding precedent in Manish Sisodia narrows Article 21 deliberations."}]',
                prediction_updated_at=datetime.utcnow(),
            )
            db.add(c1)

        if not db.query(PendingCase).filter_by(case_no="W.P.(C) 4120/2022").first():
            c2 = PendingCase(
                case_no="W.P.(C) 4120/2022",
                case_type="W.P.(C)",
                court="High Court of Delhi",
                filing_date=date(2022, 3, 18),
                hearings_count=22,
                status=CaseStatus.reserved,
                description="Writ petition challenging rejection of pharmaceutical patent extension application under Section 3(d) of Patents Act. Arguments concluded; orders reserved.",
                top1_similarity=0.762,
                mean_top5_similarity=0.694,
                count_above_threshold=2,
                similarity_spread=0.045,
                precedent_age_mean=4.5,
                outcome_agreement=0.6,
                predicted_days=32.0,
                complexity=ComplexityClass.high,
                priority_score=71.0,
                shap_reasons='[{"feature":"Judgment Reserved","impact":"reduces_delay","impact_days":-85.0,"plain_english_reason":"Hearing fully concluded; order pronouncement expected within 60 days."}]',
                prediction_updated_at=datetime.utcnow(),
            )
            db.add(c2)

        db.commit()

        print("Database seeded successfully with authentic judgments and pending cases!")
    except Exception as exc:
        db.rollback()
        print(f"Seeding failed: {exc}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
