"""Lectura y plantilla de Excel para carga masiva de equipos (RF-008)."""
from datetime import date, datetime
from io import BytesIO

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font

# Columnas esperadas en el Excel (en este orden).
COLUMNAS: list[str] = [
    "codigo_interno",
    "serial_fabricante",
    "nombre",
    "marca",
    "modelo",
    "criticidad",
    "registro_invima",
    "clasificacion_riesgo",
    "estado",
    "propiedad",
    "sede",
    "servicio",
    "proveedor",
    "fecha_adquisicion",
    "costo_adquisicion",
    "fin_garantia",
    "orden_compra",
]


def _celda_a_texto(valor: object) -> str | None:
    if valor is None:
        return None
    if isinstance(valor, datetime | date):
        return valor.date().isoformat() if isinstance(valor, datetime) else valor.isoformat()
    texto = str(valor).strip()
    return texto or None


def parse_equipos(contenido: bytes) -> list[tuple[int, dict[str, str | None]]]:
    """Devuelve una lista de (número de fila, {columna: valor}) desde la 2ª fila."""
    wb = load_workbook(BytesIO(contenido), data_only=True)
    ws = wb.active
    filas: list[tuple[int, dict[str, str | None]]] = []
    for indice, fila in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        valores = {
            col: _celda_a_texto(fila[i] if i < len(fila) else None)
            for i, col in enumerate(COLUMNAS)
        }
        if any(v is not None for v in valores.values()):
            filas.append((indice, valores))
    return filas


def generar_plantilla() -> bytes:
    """Genera un Excel con la fila de encabezados y un ejemplo."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Equipos"
    ws.append(COLUMNAS)
    for celda in ws[1]:
        celda.font = Font(bold=True)
    ws.append(
        [
            "EQ-001",
            "SN12345",
            "Monitor de signos vitales",
            "Mindray",
            "uMEC12",
            "alta",
            "INVIMA-2020-001",
            "IIb",
            "operativo",
            "propio",
            "Sede Principal",
            "UCI",
            "Proveedor Uno",
            "2025-01-15",
            "12500000",
            "2027-01-15",
            "OC-77",
        ]
    )
    salida = BytesIO()
    wb.save(salida)
    return salida.getvalue()
