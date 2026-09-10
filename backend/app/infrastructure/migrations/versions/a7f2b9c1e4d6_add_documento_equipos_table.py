"""Add documento_equipos table for equipment documents

Revision ID: a7f2b9c1e4d6
Revises: df83e5d14dd3
Create Date: 2026-09-07 09:00:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7f2b9c1e4d6'
down_revision: str | None = 'df83e5d14dd3'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create documento_equipos table
    op.create_table(
        'documento_equipos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('equipo_id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=True),
        sa.Column('tipo', sa.String(length=30), nullable=False),
        sa.Column('nombre_archivo', sa.String(length=255), nullable=False),
        sa.Column('ruta_archivo', sa.String(length=500), nullable=False),
        sa.Column('tamaño_bytes', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False, server_default='application/octet-stream'),
        sa.Column('descripcion', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['equipo_id'], ['equipos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_documento_equipos_equipo_id'), 'documento_equipos', ['equipo_id'], unique=False)
    op.create_index(op.f('ix_documento_equipos_tipo'), 'documento_equipos', ['tipo'], unique=False)
    op.create_index(op.f('ix_documento_equipos_usuario_id'), 'documento_equipos', ['usuario_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_documento_equipos_usuario_id'), table_name='documento_equipos')
    op.drop_index(op.f('ix_documento_equipos_tipo'), table_name='documento_equipos')
    op.drop_index(op.f('ix_documento_equipos_equipo_id'), table_name='documento_equipos')
    op.drop_table('documento_equipos')
