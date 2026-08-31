"""RBAC dinámico: tablas roles/permisos/rol_permiso y usuarios.rol_id

Migra usuarios.rol (enum) -> usuarios.rol_id (FK a roles) preservando los
usuarios existentes, y elimina el tipo enum 'rol'.

Revision ID: 860808e98b79
Revises: 30cb5b554a6f
Create Date: 2026-08-31
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "860808e98b79"
down_revision: str | None = "30cb5b554a6f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Roles base que deben existir para poder migrar los usuarios actuales.
ROLES_SISTEMA = [
    ("admin", "Acceso total al sistema"),
    ("coordinador", "Coordinación biomédica: gestión operativa y usuarios"),
    ("ingeniero_biomedico", "Gestión técnica de equipos y mantenimiento"),
    ("tecnico", "Ejecución de mantenimientos y registro en campo"),
    ("consulta", "Solo lectura"),
]


def upgrade() -> None:
    # 1) Tabla roles
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=50), nullable=False),
        sa.Column("descripcion", sa.String(length=200), nullable=True),
        sa.Column("es_sistema", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_roles")),
    )
    op.create_index(op.f("ix_roles_nombre"), "roles", ["nombre"], unique=True)

    # 2) Tabla permisos
    op.create_table(
        "permisos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("modulo", sa.String(length=50), nullable=False),
        sa.Column("accion", sa.String(length=50), nullable=False),
        sa.Column("codigo", sa.String(length=101), nullable=False),
        sa.Column("descripcion", sa.String(length=200), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_permisos")),
    )
    op.create_index(op.f("ix_permisos_modulo"), "permisos", ["modulo"], unique=False)
    op.create_index(op.f("ix_permisos_codigo"), "permisos", ["codigo"], unique=True)

    # 3) Tabla puente rol_permiso
    op.create_table(
        "rol_permiso",
        sa.Column("rol_id", sa.Integer(), nullable=False),
        sa.Column("permiso_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["rol_id"], ["roles.id"], name=op.f("fk_rol_permiso_rol_id_roles"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["permiso_id"], ["permisos.id"],
            name=op.f("fk_rol_permiso_permiso_id_permisos"), ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("rol_id", "permiso_id", name=op.f("pk_rol_permiso")),
    )

    # 4) Sembrar los roles de sistema (necesarios para el backfill)
    roles_tbl = sa.table(
        "roles",
        sa.column("nombre", sa.String),
        sa.column("descripcion", sa.String),
        sa.column("es_sistema", sa.Boolean),
    )
    op.bulk_insert(
        roles_tbl,
        [
            {"nombre": n, "descripcion": d, "es_sistema": True}
            for n, d in ROLES_SISTEMA
        ],
    )

    # 5) usuarios.rol_id (nullable temporal) + backfill desde el enum + not null
    op.add_column("usuarios", sa.Column("rol_id", sa.Integer(), nullable=True))
    op.execute(
        "UPDATE usuarios u SET rol_id = r.id "
        "FROM roles r WHERE r.nombre = u.rol::text"
    )
    # Cualquier usuario sin match cae a 'consulta' (seguridad mínima).
    op.execute(
        "UPDATE usuarios SET rol_id = (SELECT id FROM roles WHERE nombre='consulta') "
        "WHERE rol_id IS NULL"
    )
    op.alter_column("usuarios", "rol_id", nullable=False)
    op.create_index(op.f("ix_usuarios_rol_id"), "usuarios", ["rol_id"], unique=False)
    op.create_foreign_key(
        op.f("fk_usuarios_rol_id_roles"), "usuarios", "roles", ["rol_id"], ["id"]
    )

    # 6) Eliminar la columna enum antigua y su tipo
    op.drop_column("usuarios", "rol")
    op.execute("DROP TYPE IF EXISTS rol")


def downgrade() -> None:
    rol_enum = sa.Enum(
        "admin", "coordinador", "ingeniero_biomedico", "tecnico", "consulta",
        name="rol",
    )
    rol_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "usuarios",
        sa.Column("rol", rol_enum, nullable=False, server_default="consulta"),
    )
    op.execute(
        "UPDATE usuarios u SET rol = r.nombre::rol "
        "FROM roles r WHERE r.id = u.rol_id "
        "AND r.nombre IN ('admin','coordinador','ingeniero_biomedico','tecnico','consulta')"
    )
    op.alter_column("usuarios", "rol", server_default=None)

    op.drop_constraint(op.f("fk_usuarios_rol_id_roles"), "usuarios", type_="foreignkey")
    op.drop_index(op.f("ix_usuarios_rol_id"), table_name="usuarios")
    op.drop_column("usuarios", "rol_id")

    op.drop_table("rol_permiso")
    op.drop_index(op.f("ix_permisos_codigo"), table_name="permisos")
    op.drop_index(op.f("ix_permisos_modulo"), table_name="permisos")
    op.drop_table("permisos")
    op.drop_index(op.f("ix_roles_nombre"), table_name="roles")
    op.drop_table("roles")
