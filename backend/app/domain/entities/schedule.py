"""Entidad de Dominio - Schedule (Módulo Tardanzas - RF-031)."""
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ScheduleBlock:
    id: int | None
    name: str
    start_time: str  # HH:MM
    end_time: str    # HH:MM
    block_order: int = 0
    crosses_midnight: bool = False
    is_entry_point: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


@dataclass
class Schedule:
    id: int | None
    department_id: int
    name: str
    schedule_type: str = "FIXED"  # FIXED | SHIFT
    days_of_week: str = ""  # JSON array
    tolerance_min: int = 0
    expected_entries_per_day: int | None = None
    expected_exits_per_day: int | None = None
    is_active: bool = True
    is_deleted: bool = False
    notes: str | None = None
    blocks: list[ScheduleBlock] | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
