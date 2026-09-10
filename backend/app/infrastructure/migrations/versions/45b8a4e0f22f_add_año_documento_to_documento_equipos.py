"""add año_documento to documento_equipos

Revision ID: 45b8a4e0f22f
Revises: a7f2b9c1e4d6
Create Date: 2026-09-07 09:25:11.938977
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '45b8a4e0f22f'
down_revision: str | None = 'a7f2b9c1e4d6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('documento_equipos', sa.Column('año_documento', sa.Integer(), nullable=True, comment='Año en que se generó el documento'))
    op.create_index(op.f('ix_documento_equipos_año_documento'), 'documento_equipos', ['año_documento'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_documento_equipos_año_documento'), table_name='documento_equipos')
    op.drop_column('documento_equipos', 'año_documento')
