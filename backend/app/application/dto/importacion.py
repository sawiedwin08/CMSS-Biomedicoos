"""DTOs del resultado de una importación masiva (RF-008)."""
from dataclasses import dataclass, field


@dataclass
class ErrorFila:
    fila: int
    mensaje: str


@dataclass
class ResultadoImportacion:
    total: int = 0
    creados: int = 0
    errores: list[ErrorFila] = field(default_factory=list)
