"""Servicio o área dentro de una sede (p. ej. UCI, Urgencias, Imágenes)."""
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class Servicio(Base, TimestampMixin):
    __tablename__ = "servicios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), index=True)
    sede_id: Mapped[int] = mapped_column(ForeignKey("sedes.id"), index=True)
    activo: Mapped[bool] = mapped_column(default=True)

    sede: Mapped["Sede"] = relationship(back_populates="servicios")  # noqa: F821
