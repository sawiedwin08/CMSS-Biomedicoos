"""Entidad de Dominio - ProcessingHistory y AttendanceRecord (Módulo Tardanzas - RF-031)."""
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class AttendanceRecord:
    id: int | None
    processing_history_id: int
    legajo: str
    nombre: str
    department_id: int | None
    department_name: str
    record_type: str  # ENTRY | EXIT
    record_date: datetime
    record_datetime: datetime
    day_of_week: str | None = None
    classification: str = ""
    late_minutes: int = 0
    early_leave_minutes: int = 0
    is_inconsistency: bool = False
    observation: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


@dataclass
class ProcessingHistory:
    id: int | None
    original_file_name: str
    total_rows: int
    total_entries: int
    total_exits: int
    total_late_arrivals: int
    total_without_late: int
    total_inconsistencies: int
    total_early_leaves: int
    total_record_count_issues: int
    report_path: str | None = None
    status: str = "Procesado"
    error_message: str | None = None
    records: list[AttendanceRecord] = field(default_factory=list)
    created_at: datetime | None = None
    updated_at: datetime | None = None
