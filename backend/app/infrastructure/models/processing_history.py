"""Historial de procesamiento de archivos Excel (Módulo Tardanzas - RF-031)."""
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class ProcessingHistory(Base, TimestampMixin):
    __tablename__ = "processing_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    original_file_name: Mapped[str] = mapped_column(String(500))
    total_rows: Mapped[int]
    total_entries: Mapped[int]
    total_exits: Mapped[int]
    total_late_arrivals: Mapped[int]
    total_without_late: Mapped[int]
    total_inconsistencies: Mapped[int]
    total_early_leaves: Mapped[int]
    total_record_count_issues: Mapped[int]
    report_path: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(100))  # "Procesado" o "Procesado con inconsistencias"
    error_message: Mapped[str | None] = mapped_column(Text)

    records: Mapped[list["AttendanceRecord"]] = relationship(
        back_populates="processing_history",
        cascade="all, delete-orphan"
    )
