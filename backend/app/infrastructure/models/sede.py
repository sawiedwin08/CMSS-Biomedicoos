"""Sede física de la institución (soporte multi-sede, RNF-007)."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class Sede(Base, TimestampMixin):
    __tablename__ = "sedes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    direccion: Mapped[str | None] = mapped_column(String(250))
    ciudad: Mapped[str | None] = mapped_column(String(100))
    activo: Mapped[bool] = mapped_column(default=True)

    servicios: Mapped[list["Servicio"]] = relationship(  # noqa: F821
        back_populates="sede", cascade="all, delete-orphan"
    )
