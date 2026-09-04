"""DTOs para el módulo de Tardanzas (RF-031)."""
from dataclasses import dataclass, field


@dataclass
class DatosDepartamento:
    nombre: str
    notas: str | None = None
    activo: bool = True


@dataclass
class DatosScheduleBlock:
    nombre: str
    hora_inicio: str  # HH:MM
    hora_fin: str     # HH:MM
    orden: int = 0
    cruza_medianoche: bool = False
    es_entrada: bool = True


@dataclass
class DatosSchedule:
    department_id: int
    nombre: str
    tipo_horario: str = "FIXED"  # FIXED | SHIFT
    dias_semana: list[str] = field(default_factory=list)  # ["MONDAY", "TUESDAY", ...]
    tolerancia_min: int = 0
    entradas_esperadas: int | None = None
    salidas_esperadas: int | None = None
    activo: bool = True
    notas: str | None = None
    bloques: list[DatosScheduleBlock] = field(default_factory=list)


@dataclass
class DatosConfiguracion:
    clave: str
    valor: str
