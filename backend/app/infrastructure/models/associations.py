"""Tablas de asociación (relaciones muchos-a-muchos)."""
from sqlalchemy import Column, ForeignKey, Table

from app.infrastructure.db.base import Base

# Rol <-> Permiso (RF-029)
rol_permiso = Table(
    "rol_permiso",
    Base.metadata,
    Column(
        "rol_id",
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "permiso_id",
        ForeignKey("permisos.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

# Rol <-> Módulo (acceso a módulos de la plataforma por rol)
rol_modulo = Table(
    "rol_modulo",
    Base.metadata,
    Column(
        "rol_id",
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "modulo_id",
        ForeignKey("modulos.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
