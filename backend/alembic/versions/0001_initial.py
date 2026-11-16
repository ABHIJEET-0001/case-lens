"""
alembic/versions/0001_initial.py
─────────────────────────────────
Initial migration — creates all four core tables.

Tables: users, judgments, summaries, pending_cases
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column(
            "role",
            sa.Enum("clerk", "researcher", "judge", name="userrole"),
            nullable=False,
            server_default="clerk",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── judgments ──────────────────────────────────────────────────────────────
    op.create_table(
        "judgments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column("citation", sa.String(255), nullable=True),
        sa.Column("court", sa.String(255), nullable=False),
        sa.Column("case_type", sa.String(100), nullable=True),
        sa.Column("bench", sa.String(512), nullable=True),
        sa.Column("judgment_date", sa.Date(), nullable=True),
        sa.Column("outcome", sa.String(100), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("full_text", sa.Text(), nullable=False),
        sa.Column("word_count", sa.Integer(), nullable=True),
        sa.Column("is_indexed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_judgments_citation", "judgments", ["citation"])
    op.create_index("ix_judgments_court", "judgments", ["court"])
    op.create_index("ix_judgments_case_type", "judgments", ["case_type"])
    op.create_index("ix_judgments_judgment_date", "judgments", ["judgment_date"])

    # ── summaries ──────────────────────────────────────────────────────────────
    op.create_table(
        "summaries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "judgment_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("judgments.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("facts", sa.Text(), nullable=True),
        sa.Column("issue", sa.Text(), nullable=True),
        sa.Column("holding", sa.Text(), nullable=True),
        sa.Column("outcome_text", sa.Text(), nullable=True),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_summaries_judgment_id", "summaries", ["judgment_id"], unique=True)

    # ── pending_cases ──────────────────────────────────────────────────────────
    op.create_table(
        "pending_cases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("case_no", sa.String(100), nullable=False),
        sa.Column("case_type", sa.String(100), nullable=False),
        sa.Column("court", sa.String(255), nullable=False),
        sa.Column("filing_date", sa.Date(), nullable=False),
        sa.Column("hearings_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "hearing", "reserved", "disposed", name="casestatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "assigned_to",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        # Precedent-strength features (populated by retrieval module)
        sa.Column("top1_similarity", sa.Float(), nullable=True),
        sa.Column("mean_top5_similarity", sa.Float(), nullable=True),
        sa.Column("count_above_threshold", sa.Integer(), nullable=True),
        sa.Column("similarity_spread", sa.Float(), nullable=True),
        sa.Column("precedent_age_mean", sa.Float(), nullable=True),
        sa.Column("outcome_agreement", sa.Float(), nullable=True),
        # Prediction outputs (populated by prediction module)
        sa.Column("predicted_days", sa.Float(), nullable=True),
        sa.Column(
            "complexity",
            sa.Enum("Low", "Medium", "High", name="complexityclass"),
            nullable=True,
        ),
        sa.Column("priority_score", sa.Float(), nullable=True),
        sa.Column("shap_reasons", sa.Text(), nullable=True),
        sa.Column("prediction_updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_pending_cases_case_no", "pending_cases", ["case_no"], unique=True)


def downgrade() -> None:
    op.drop_table("pending_cases")
    op.drop_table("summaries")
    op.drop_table("judgments")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS casestatus")
    op.execute("DROP TYPE IF EXISTS complexityclass")
    op.execute("DROP TYPE IF EXISTS userrole")
