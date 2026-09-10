"""Add permisos mantenimiento (RF-013..017)

Revision ID: e5f3g7h9j2k1
Revises: fdf2bce648a6
Create Date: 2026-09-08 10:00:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = 'e5f3g7h9j2k1'
down_revision: str | None = 'fdf2bce648a6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1) Crear los permisos (si no existen)
    permisos_sql = """
    INSERT INTO permisos (modulo, accion, codigo, descripcion)
    VALUES
        ('mantenimiento', 'ver', 'mantenimiento:ver', 'Ver órdenes de trabajo y checklists'),
        ('mantenimiento', 'crear', 'mantenimiento:crear', 'Crear órdenes de trabajo y checklists'),
        ('mantenimiento', 'editar', 'mantenimiento:editar', 'Editar órdenes de trabajo y registrar ejecución'),
        ('mantenimiento', 'eliminar', 'mantenimiento:eliminar', 'Eliminar órdenes de trabajo')
    ON CONFLICT (codigo) DO NOTHING
    """
    op.execute(sa.text(permisos_sql))

    # 2) Asignar permisos a roles
    asignaciones = [
        ("admin", "mantenimiento:ver"),
        ("admin", "mantenimiento:crear"),
        ("admin", "mantenimiento:editar"),
        ("admin", "mantenimiento:eliminar"),
        ("coordinador", "mantenimiento:ver"),
        ("coordinador", "mantenimiento:crear"),
        ("coordinador", "mantenimiento:editar"),
        ("coordinador", "mantenimiento:eliminar"),
        ("ingeniero_biomedico", "mantenimiento:ver"),
        ("ingeniero_biomedico", "mantenimiento:crear"),
        ("ingeniero_biomedico", "mantenimiento:editar"),
        ("tecnico", "mantenimiento:ver"),
        ("tecnico", "mantenimiento:editar"),
        ("consulta", "mantenimiento:ver"),
    ]

    for rol_nombre, permiso_codigo in asignaciones:
        op.execute(
            sa.text(
                f"""
                INSERT INTO rol_permiso (rol_id, permiso_id)
                SELECT r.id, p.id
                FROM roles r, permisos p
                WHERE r.nombre = '{rol_nombre}' AND p.codigo = '{permiso_codigo}'
                ON CONFLICT DO NOTHING
                """
            )
        )


def downgrade() -> None:
    # Eliminar los permisos
    op.execute(
        sa.text(
            "DELETE FROM rol_permiso WHERE permiso_id IN "
            "(SELECT id FROM permisos WHERE modulo = 'mantenimiento')"
        )
    )
    op.execute(
        sa.text(
            "DELETE FROM permisos WHERE modulo = 'mantenimiento'"
        )
    )
