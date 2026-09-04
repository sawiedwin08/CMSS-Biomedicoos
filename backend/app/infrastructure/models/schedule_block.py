"""Bloque horario dentro de un horario laboral (Módulo Tardanzas - RF-031)."""
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class ScheduleBlock(Base, TimestampMixin):
    __tablename__ = "schedule_blocks"

    id: Mapped[int] = mapped_column(primary_key=True)
    schedule_id: Mapped[int] = mapped_column(ForeignKey("schedules.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    start_time: Mapped[str] = mapped_column(String(8))  # HH:MM format
    end_time: Mapped[str] = mapped_column(String(8))    # HH:MM format
    block_order: Mapped[int] = mapped_column(default=0)
    crosses_midnight: Mapped[bool] = mapped_column(default=False)
    is_entry_point: Mapped[bool] = mapped_column(default=True)

    schedule: Mapped["Schedule"] = relationship(back_populates="blocks")
