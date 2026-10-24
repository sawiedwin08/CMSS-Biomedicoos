"""Separar el módulo biomédico en su propio esquema PostgreSQL.

Arquitectura: un esquema por módulo. El auth/RBAC (usuarios, roles, permisos,
modulos y sus tablas puente) queda en `public` como esquema de acceso compartido;
las tablas del módulo biomédico se trasladan al esquema `biomedicos`.

El traslado es `ALTER ... SET SCHEMA`, una operación de metadatos: no copia ni
reescribe datos, conserva índices, constraints y claves foráneas (incluidas las
que cruzan a `public.usuarios`).

Además:
- Renombra los índices de las tablas movidas para que sigan la convención de
  nombres (que ahora antepone el esquema), evitando ruido en futuras
  autogeneraciones.
- Crea la tabla `app_settings` (que no había sido creada por ninguna migración).

Revision ID: k2m4o6q8s0u2
Revises: j0k2m4o6q8s0
"""
import sqlalchemy as sa
from alembic import op

revision = "k2m4o6q8s0u2"
down_revision = "j0k2m4o6q8s0"
branch_labels = None
depends_on = None

# Tablas del módulo biomédico que se trasladan a su propio esquema.
TABLAS_BIOMEDICOS = [
    "equipos",
    "sedes",
    "servicios",
    "proveedores",
    "documento_equipos",
    "movimientos_equipo",
    "ordenes_trabajo",
    "checklists_equipo",
    "checklist_pasos",
    "ejecucion_checklist_pasos",
    "plantillas_rutina",
]

# Índices a renombrar: ix_<sufijo>  ->  ix_biomedicos_<sufijo>
SUFIJOS_INDICES = [
    "checklist_pasos_checklist_id",
    "checklists_equipo_equipo_id",
    "documento_equipos_año_documento",
    "documento_equipos_equipo_id",
    "documento_equipos_tipo",
    "documento_equipos_usuario_id",
    "ejecucion_checklist_pasos_ot_id",
    "equipos_codigo_interno",
    "equipos_nombre",
    "equipos_numero_activo",
    "equipos_sede_id",
    "equipos_serial_fabricante",
    "equipos_servicio_id",
    "movimientos_equipo_equipo_id",
    "ordenes_trabajo_equipo_id",
    "plantillas_rutina_nombre",
    "proveedores_nombre",
    "sedes_nombre",
    "servicios_nombre",
    "servicios_sede_id",
]


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS biomedicos")
    for tabla in TABLAS_BIOMEDICOS:
        op.execute(f"ALTER TABLE {tabla} SET SCHEMA biomedicos")
    # La secuencia que genera el código interno de equipos (EQ-0001).
    op.execute("ALTER SEQUENCE equipo_codigo_seq SET SCHEMA biomedicos")

    # Los índices se mueven con sus tablas: ahora viven en `biomedicos`.
    for sufijo in SUFIJOS_INDICES:
        op.execute(
            f'ALTER INDEX biomedicos."ix_{sufijo}" RENAME TO "ix_biomedicos_{sufijo}"'
        )

    # Tabla de configuración global (faltaba en el historial de migraciones).
    op.create_table(
        "app_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=200), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False
        ),
        sa.PrimaryKeyConstraint("id", name="pk_app_settings"),
    )
    op.create_index("ix_app_settings_key", "app_settings", ["key"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_app_settings_key", table_name="app_settings")
    op.drop_table("app_settings")

    for sufijo in SUFIJOS_INDICES:
        op.execute(
            f'ALTER INDEX biomedicos."ix_biomedicos_{sufijo}" RENAME TO "ix_{sufijo}"'
        )

    op.execute("ALTER SEQUENCE biomedicos.equipo_codigo_seq SET SCHEMA public")
    for tabla in TABLAS_BIOMEDICOS:
        op.execute(f"ALTER TABLE biomedicos.{tabla} SET SCHEMA public")
    op.execute("DROP SCHEMA IF EXISTS biomedicos")
