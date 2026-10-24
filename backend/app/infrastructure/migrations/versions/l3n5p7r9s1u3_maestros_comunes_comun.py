"""Mover los maestros compartidos (sede, área/servicio, proveedor) al esquema `comun`.

Arquitectura: sede, servicio (área) y proveedor son datos de toda la plataforma
(los usan Biomédicos y Sistemas), así que dejan de vivir en `biomedicos` y pasan
al esquema compartido `comun`. Las claves foráneas que los referencian (equipos,
movimientos de equipo) siguen funcionando: `ALTER ... SET SCHEMA` las conserva.

Revision ID: l3n5p7r9s1u3
Revises: k2m4o6q8s0u2
"""
from alembic import op

revision = "l3n5p7r9s1u3"
down_revision = "k2m4o6q8s0u2"
branch_labels = None
depends_on = None

TABLAS_COMUN = ["sedes", "servicios", "proveedores"]

# Índices a renombrar: ix_biomedicos_<x>  ->  ix_comun_<x>
SUFIJOS_INDICES = [
    "sedes_nombre",
    "servicios_nombre",
    "servicios_sede_id",
    "proveedores_nombre",
]


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS comun")
    for tabla in TABLAS_COMUN:
        op.execute(f"ALTER TABLE biomedicos.{tabla} SET SCHEMA comun")
    for sufijo in SUFIJOS_INDICES:
        op.execute(
            f'ALTER INDEX comun."ix_biomedicos_{sufijo}" RENAME TO "ix_comun_{sufijo}"'
        )


def downgrade() -> None:
    for sufijo in SUFIJOS_INDICES:
        op.execute(
            f'ALTER INDEX comun."ix_comun_{sufijo}" RENAME TO "ix_biomedicos_{sufijo}"'
        )
    for tabla in TABLAS_COMUN:
        op.execute(f"ALTER TABLE comun.{tabla} SET SCHEMA biomedicos")
    op.execute("DROP SCHEMA IF EXISTS comun")
