"""Horario laboral por departamento y día de la semana (Módulo Tardanzas - RF-031)."""
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class Schedule(Base, TimestampMixin):
    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    schedule_type: Mapped[str] = mapped_column(String(20), default="FIXED")  # FIXED | SHIFT
    days_of_week: Mapped[str] = mapped_column(Text)  # JSON array: ["MONDAY", "TUESDAY", ...]
    tolerance_min: Mapped[int] = mapped_column(default=0)
    expected_entries_per_day: Mapped[int | None]
    expected_exits_per_day: Mapped[int | None]
    is_active: Mapped[bool] = mapped_column(default=True)
    is_deleted: Mapped[bool] = mapped_column(default=False)
    notes: Mapped[str | None] = mapped_column(String(500))

    blocks: Mapped[list["ScheduleBlock"]] = relationship(
        back_populates="schedule",
        cascade="all, delete-orphan"
    )
    department: Mapped["Department"] = relationship(back_populates="schedules")
