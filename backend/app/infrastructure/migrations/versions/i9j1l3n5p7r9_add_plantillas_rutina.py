"""Add plantillas_rutina (rutinas de mantenimiento reutilizables)

Revision ID: i9j1l3n5p7r9
Revises: h8i0k2m4n6p8
Create Date: 2026-10-13 10:00:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = 'i9j1l3n5p7r9'
down_revision: str | None = 'h8i0k2m4n6p8'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'plantillas_rutina',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('nombre', sa.String(200), nullable=False),
        sa.Column('pasos', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_plantillas_rutina_nombre', 'plantillas_rutina', ['nombre'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_plantillas_rutina_nombre', table_name='plantillas_rutina')
    op.drop_table('plantillas_rutina')
