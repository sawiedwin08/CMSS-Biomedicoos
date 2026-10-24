"""Add fecha_ultimo_mantenimiento a equipos (campo manual, respaldo por OT)

Revision ID: h8i0k2m4n6p8
Revises: g7h9j1k3m5n7
Create Date: 2026-10-08 12:30:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = 'h8i0k2m4n6p8'
down_revision: str | None = 'g7h9j1k3m5n7'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        'equipos',
        sa.Column('fecha_ultimo_mantenimiento', sa.Date(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('equipos', 'fecha_ultimo_mantenimiento')
