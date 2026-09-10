"""Add repuestos field and OTRA type to maintenance (RF-013)

Revision ID: f6g8h0j2k4m2
Revises: e5f3g7h9j2k1
Create Date: 2026-09-08 10:30:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = 'f6g8h0j2k4m2'
down_revision: str | None = 'e5f3g7h9j2k1'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1) Agregar valor 'otra' al enum tipo_mantenimiento
    op.execute(
        sa.text(
            "ALTER TYPE tipo_mantenimiento ADD VALUE 'otra' AFTER 'calibracion'"
        )
    )

    # 2) Agregar columna repuestos a ordenes_trabajo
    op.add_column(
        'ordenes_trabajo',
        sa.Column('repuestos', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    # 1) Remover la columna repuestos
    op.drop_column('ordenes_trabajo', 'repuestos')

    # Nota: No se puede remover valores de un enum en PostgreSQL fácilmente,
    # así que dejaré 'otra' en la BD pero la aplicación no lo usará.
