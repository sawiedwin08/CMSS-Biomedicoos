"""Representante / distribuidor de equipos biomédicos.

Maestro propio del módulo biomédico: al registrar un equipo se elige un
representante y sus datos se copian (snapshot) en los campos del equipo.
"""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class Representante(Base, TimestampMixin):
    __tablename__ = "representantes"
    __table_args__ = {"schema": "biomedicos"}

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    pais: Mapped[str | None] = mapped_column(String(100))
    ciudad: Mapped[str | None] = mapped_column(String(100))
    direccion: Mapped[str | None] = mapped_column(String(200))
    telefono: Mapped[str | None] = mapped_column(String(50))
    correo: Mapped[str | None] = mapped_column(String(150))
    activo: Mapped[bool] = mapped_column(default=True)
