"""Checklist de mantenimiento por equipo (RF-013)."""
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class ChecklistEquipo(Base, TimestampMixin):
    """Define los pasos que debe seguir un mantenimiento para un equipo específico."""
    __tablename__ = "checklists_equipo"

    id: Mapped[int] = mapped_column(primary_key=True)
    equipo_id: Mapped[int] = mapped_column(ForeignKey("equipos.id"), index=True, unique=True)

    nombre: Mapped[str] = mapped_column(String(200))
    descripcion: Mapped[str | None] = mapped_column(Text)
    activo: Mapped[bool] = mapped_column(default=True)

    pasos: Mapped[list["ChecklistPaso"]] = relationship(
        "ChecklistPaso",
        back_populates="checklist",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ChecklistPaso(Base):
    """Cada paso individual del checklist."""
    __tablename__ = "checklist_pasos"

    id: Mapped[int] = mapped_column(primary_key=True)
    checklist_id: Mapped[int] = mapped_column(ForeignKey("checklists_equipo.id"), index=True)

    orden: Mapped[int]
    descripcion: Mapped[str] = mapped_column(String(500))
    instrucciones: Mapped[str | None] = mapped_column(Text)

    checklist: Mapped["ChecklistEquipo"] = relationship(
        "ChecklistEquipo",
        back_populates="pasos",
    )
