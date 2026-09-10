"""Add tecnico_nombre field to ordenes_trabajo (RF-013)

Revision ID: g7h9j1k3m5n7
Revises: f6g8h0j2k4m2
Create Date: 2026-09-08 12:00:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = 'g7h9j1k3m5n7'
down_revision: str | None = 'f6g8h0j2k4m2'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        'ordenes_trabajo',
        sa.Column('tecnico_nombre', sa.String(200), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('ordenes_trabajo', 'tecnico_nombre')
