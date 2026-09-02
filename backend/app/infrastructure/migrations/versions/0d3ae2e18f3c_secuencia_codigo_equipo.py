"""Secuencia para autogenerar el código interno de equipos (EQ-0001)

Revision ID: 0d3ae2e18f3c
Revises: 3c48a1bee3a6
Create Date: 2026-09-01
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0d3ae2e18f3c"
down_revision: str | None = "3c48a1bee3a6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE SEQUENCE IF NOT EXISTS equipo_codigo_seq START 1")


def downgrade() -> None:
    op.execute("DROP SEQUENCE IF EXISTS equipo_codigo_seq")
