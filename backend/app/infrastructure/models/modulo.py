"""Módulo de la plataforma (suite). Cada módulo agrupa un área funcional."""
from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class ModuloModel(Base, TimestampMixin):
    __tablename__ = "modulos"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100))
    descripcion: Mapped[str | None] = mapped_column(String(300))
    icono: Mapped[str | None] = mapped_column(String(16))
    orden: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    activo: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
