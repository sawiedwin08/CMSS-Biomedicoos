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
