"""Campo 'propiedad' (tenencia) en equipos

Revision ID: a6e34c01cd0f
Revises: 0d3ae2e18f3c
Create Date: 2026-09-01
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a6e34c01cd0f"
down_revision: str | None = "0d3ae2e18f3c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

propiedad_enum = postgresql.ENUM(
    "propio", "alquilado", "leasing", "prestamo", name="propiedad"
)


def upgrade() -> None:
    propiedad_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "equipos",
        sa.Column("propiedad", propiedad_enum, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("equipos", "propiedad")
    propiedad_enum.drop(op.get_bind(), checkfirst=True)
