"""Reporte Excel de la Mesa de ayuda (tickets): detalle + KPIs.

Mide tiempos (primera respuesta y resolución) y causas a partir de las marcas
de tiempo del ticket. Dos hojas: "Tickets" (una fila por ticket) y "Resumen".
"""
from collections import Counter
from datetime import datetime
from io import BytesIO
from statistics import mean, median

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from app.infrastructure.models.ticket import Ticket

ETIQUETA_ESTADO = {
    "nuevo": "Nuevo",
    "asignado": "Asignado",
    "en_proceso": "En proceso",
    "en_espera": "En espera",
    "resuelto": "Resuelto",
    "cerrado": "Cerrado",
    "reabierto": "Reabierto",
}
ETIQUETA_CATEGORIA = {
    "hardware": "Hardware",
    "software": "Software",
    "red": "Red",
    "correo": "Correo",
    "accesos": "Accesos",
    "impresion": "Impresión",
    "otro": "Otro",
}
ETIQUETA_PRIORIDAD = {
    "baja": "Baja",
    "media": "Media",
    "alta": "Alta",
    "critica": "Crítica",
}
ETIQUETA_CAUSA = {
    "hardware": "Hardware",
    "software": "Software",
    "configuracion": "Configuración",
    "usuario": "Usuario / capacitación",
    "red": "Red",
    "proveedor": "Proveedor",
    "otro": "Otro",
}
ESTADOS_CERRADOS = {"resuelto", "cerrado"}

_ENCABEZADOS = [
    "Número", "Apertura", "Solicitante", "Correo", "Área", "Categoría",
    "Asunto", "Prioridad", "Estado", "Técnico", "1ª respuesta", "Cierre",
    "T. 1ª respuesta (h)", "T. resolución (h)", "Nº comentarios", "Causa", "Solución",
]
_AZUL = "FF1F4E79"


def _fmt_dt(valor: datetime | None) -> str:
    return valor.strftime("%Y-%m-%d %H:%M") if valor else ""


def _horas(inicio: datetime | None, fin: datetime | None) -> float | None:
    if inicio is None or fin is None:
        return None
    return round((fin - inicio).total_seconds() / 3600, 1)


def _encabezar(ws, encabezados: list[str]) -> None:
    ws.append(encabezados)
    for celda in ws[1]:
        celda.font = Font(bold=True, color="FFFFFFFF")
        celda.fill = PatternFill("solid", fgColor=_AZUL)
        celda.alignment = Alignment(vertical="center")


def _autoajustar(ws, anchos: dict[int, int]) -> None:
    for col, ancho in anchos.items():
        ws.column_dimensions[get_column_letter(col)].width = ancho


def generar_reporte(datos: list[tuple[Ticket, str | None, int]]) -> bytes:
    wb = Workbook()

    # ---------- Hoja 1: detalle ----------
    ws = wb.active
    ws.title = "Tickets"
    _encabezar(ws, _ENCABEZADOS)

    tr_respuesta: list[float] = []
    tr_resolucion: list[float] = []
    por_estado: Counter = Counter()
    por_categoria: Counter = Counter()
    por_prioridad: Counter = Counter()
    por_causa: Counter = Counter()
    por_tecnico: Counter = Counter()
    resol_por_tecnico: dict[str, list[float]] = {}
    cerrados = 0

    for t, tecnico, n_com in datos:
        t_resp = _horas(t.created_at, t.fecha_primera_respuesta)
        t_resol = _horas(t.created_at, t.fecha_cierre)
        if t_resp is not None:
            tr_respuesta.append(t_resp)
        if t_resol is not None:
            tr_resolucion.append(t_resol)
        por_estado[t.estado] += 1
        por_categoria[t.categoria] += 1
        por_prioridad[t.prioridad] += 1
        if t.causa:
            por_causa[t.causa] += 1
        tecnico_lbl = tecnico or "Sin asignar"
        por_tecnico[tecnico_lbl] += 1
        if t_resol is not None:
            resol_por_tecnico.setdefault(tecnico_lbl, []).append(t_resol)
        if t.estado in ESTADOS_CERRADOS:
            cerrados += 1

        ws.append([
            t.numero,
            _fmt_dt(t.created_at),
            t.solicitante_nombre,
            t.solicitante_correo,
            t.area or "",
            ETIQUETA_CATEGORIA.get(t.categoria, t.categoria),
            t.asunto,
            ETIQUETA_PRIORIDAD.get(t.prioridad, t.prioridad),
            ETIQUETA_ESTADO.get(t.estado, t.estado),
            tecnico or "",
            _fmt_dt(t.fecha_primera_respuesta),
            _fmt_dt(t.fecha_cierre),
            t_resp if t_resp is not None else "",
            t_resol if t_resol is not None else "",
            n_com,
            ETIQUETA_CAUSA.get(t.causa or "", t.causa or ""),
            t.solucion or "",
        ])

    _autoajustar(ws, {
        1: 12, 2: 17, 3: 22, 4: 26, 5: 16, 6: 12, 7: 34, 8: 10, 9: 13,
        10: 20, 11: 17, 12: 17, 13: 17, 14: 17, 15: 14, 16: 20, 17: 40,
    })
    ws.freeze_panes = "A2"

    # ---------- Hoja 2: resumen ----------
    rs = wb.create_sheet("Resumen")
    total = len(datos)

    def bloque(titulo: str, pares: list[tuple[str, object]]) -> None:
        rs.append([titulo])
        rs.cell(row=rs.max_row, column=1).font = Font(bold=True, size=12, color=_AZUL)
        for etiqueta, valor in pares:
            rs.append([etiqueta, valor])
        rs.append([])

    def prom(xs: list[float]) -> object:
        return round(mean(xs), 1) if xs else "—"

    def med(xs: list[float]) -> object:
        return round(median(xs), 1) if xs else "—"

    tasa = f"{round(cerrados / total * 100)}%" if total else "—"
    bloque("Generales", [
        ("Generado", datetime.now().strftime("%Y-%m-%d %H:%M")),
        ("Total de tickets", total),
        ("Cerrados / resueltos", cerrados),
        ("Abiertos (en gestión)", total - cerrados),
        ("Tasa de resolución", tasa),
    ])
    bloque("Tiempos (horas)", [
        ("Promedio 1ª respuesta", prom(tr_respuesta)),
        ("Mediana 1ª respuesta", med(tr_respuesta)),
        ("Promedio resolución", prom(tr_resolucion)),
        ("Mediana resolución", med(tr_resolucion)),
    ])
    bloque("Por estado", [
        (ETIQUETA_ESTADO.get(k, k), v) for k, v in por_estado.most_common()
    ])
    bloque("Por categoría", [
        (ETIQUETA_CATEGORIA.get(k, k), v) for k, v in por_categoria.most_common()
    ])
    bloque("Por prioridad", [
        (ETIQUETA_PRIORIDAD.get(k, k), v) for k, v in por_prioridad.most_common()
    ])
    bloque("Top causas", [
        (ETIQUETA_CAUSA.get(k, k), v) for k, v in por_causa.most_common()
    ] or [("Sin datos de causa", 0)])
    bloque("Por técnico (tickets · prom. resolución h)", [
        (
            tecnico,
            f"{total_t} · {round(mean(resol_por_tecnico[tecnico]), 1) if resol_por_tecnico.get(tecnico) else '—'}",
        )
        for tecnico, total_t in por_tecnico.most_common()
    ])
    _autoajustar(rs, {1: 42, 2: 24})

    salida = BytesIO()
    wb.save(salida)
    return salida.getvalue()
