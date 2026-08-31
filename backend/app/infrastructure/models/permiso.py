"""Permiso granular por módulo y acción (RF-029). Ej.: 'inventario:crear'."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


class PermisoModel(Base):
    __tablename__ = "permisos"

    id: Mapped[int] = mapped_column(primary_key=True)
    modulo: Mapped[str] = mapped_column(String(50), index=True)
    accion: Mapped[str] = mapped_column(String(50))
    codigo: Mapped[str] = mapped_column(String(101), unique=True, index=True)
    descripcion: Mapped[str | None] = mapped_column(String(200))
