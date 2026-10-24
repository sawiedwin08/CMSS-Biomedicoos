"""Ampliar especificaciones técnicas de equipos a TEXT (evitar truncamiento en importación)

Revision ID: j0k2m4o6q8s0
Revises: i9j1l3n5p7r9
Create Date: 2026-10-14 16:30:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = 'j0k2m4o6q8s0'
down_revision: str | None = 'i9j1l3n5p7r9'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_COLUMNAS = [
    'voltaje_operacion',
    'voltaje_maximo',
    'corriente_maxima',
    'corriente_minima',
    'potencia_consumida',
    'frecuencia',
    'presion',
    'velocidad',
    'temperatura',
    'peso',
    'capacidad',
]


def upgrade() -> None:
    for col in _COLUMNAS:
        op.alter_column('equipos', col, type_=sa.Text(), existing_type=sa.String(50))


def downgrade() -> None:
    for col in _COLUMNAS:
        op.alter_column('equipos', col, type_=sa.String(50), existing_type=sa.Text())
