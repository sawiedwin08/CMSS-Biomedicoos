"""Registro individual de asistencia procesado (Módulo Tardanzas - RF-031)."""
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class AttendanceRecord(Base, TimestampMixin):
    __tablename__ = "attendance_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    processing_history_id: Mapped[int] = mapped_column(ForeignKey("processing_history.id", ondelete="CASCADE"), index=True)
    legajo: Mapped[str] = mapped_column(String(50), index=True)
    nombre: Mapped[str] = mapped_column(String(200))
    department_id: Mapped[int | None] = mapped_column(index=True)
    department_name: Mapped[str] = mapped_column(String(200), index=True)
    record_type: Mapped[str] = mapped_column(String(20))  # ENTRY | EXIT
    record_date: Mapped[DateTime] = mapped_column(DateTime, index=True)  # Medianoche local
    record_datetime: Mapped[DateTime] = mapped_column(DateTime)  # Timestamp completo
    day_of_week: Mapped[str | None] = mapped_column(String(20))  # MONDAY, TUESDAY, etc.
    classification: Mapped[str] = mapped_column(String(200))  # Resultado del cálculo
    late_minutes: Mapped[int] = mapped_column(default=0)
    early_leave_minutes: Mapped[int] = mapped_column(default=0)
    is_inconsistency: Mapped[bool] = mapped_column(default=False)
    observation: Mapped[str | None] = mapped_column(Text)

    processing_history: Mapped["ProcessingHistory"] = relationship(back_populates="records")
