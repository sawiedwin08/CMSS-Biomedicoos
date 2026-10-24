"""Generación de actas en PDF (módulo Sistemas) con reportlab.

Réplica de la 'Hoja de Asignación de Equipos Tecnológicos' (Word): logo,
encabezado, datos del equipo, del funcionario, accesorios, estado, compromiso
y firmas (digitadas, con línea para firma manual tras imprimir).
"""
from datetime import date
from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

_LOGO = Path(__file__).resolve().parents[2] / "assets" / "logo_sistemas.png"

_AZUL = colors.HexColor("#1f3b57")
_GRIS = colors.HexColor("#e9eef3")

_COMPROMISO = (
    "El funcionario que recibe declara haber recibido el recurso tecnológico y los "
    "accesorios relacionados en las condiciones descritas, comprometiéndose a darles "
    "el uso adecuado, a custodiarlos y conservarlos en buen estado, a emplearlos "
    "únicamente para fines laborales e institucionales, y a reportar oportunamente "
    "cualquier daño, pérdida, falla o novedad. El equipo deberá ser devuelto al "
    "momento del retiro, traslado o cuando la entidad así lo requiera."
)


def _estilos():
    base = getSampleStyleSheet()
    return {
        "titulo": ParagraphStyle(
            "titulo", parent=base["Title"], fontSize=14, textColor=_AZUL, spaceAfter=2
        ),
        "seccion": ParagraphStyle(
            "seccion",
            parent=base["Heading4"],
            fontSize=10,
            textColor=colors.white,
            backColor=_AZUL,
            leftIndent=4,
            spaceBefore=8,
            spaceAfter=4,
        ),
        "normal": ParagraphStyle("n", parent=base["Normal"], fontSize=9),
        "pequeno": ParagraphStyle("p", parent=base["Normal"], fontSize=8),
    }


def _celda(texto: str | None, est) -> Paragraph:
    return Paragraph(texto or "", est)


def _tabla_datos(filas: list[list], est, anchos) -> Table:
    data = [[_celda(c if isinstance(c, str) else "", est) for c in fila] for fila in filas]
    t = Table(data, colWidths=anchos)
    t.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 0), (0, -1), _GRIS),
                ("BACKGROUND", (2, 0), (2, -1), _GRIS),
            ]
        )
    )
    return t


def _tipo_equipo(activo) -> str:
    etiquetas = {"computo": "Equipo de cómputo", "red": "Equipo de red", "periferico": "Periférico"}
    return etiquetas.get(activo.categoria, activo.categoria or "")


def generar_acta_asignacion(activo, datos) -> bytes:
    est = _estilos()
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=letter, topMargin=1.2 * cm, bottomMargin=1.2 * cm,
        leftMargin=1.5 * cm, rightMargin=1.5 * cm,
    )
    fecha = datos.fecha or date.today().isoformat()
    el: list = []

    # Encabezado: logo + título
    titulo = Paragraph("HOJA DE ASIGNACIÓN DE EQUIPOS TECNOLÓGICOS", est["titulo"])
    sub = Paragraph(
        f"Código: {datos.codigo or activo.codigo_interno}&nbsp;&nbsp;&nbsp;"
        f"Versión: 001&nbsp;&nbsp;&nbsp;Fecha: {fecha}",
        est["pequeno"],
    )
    if _LOGO.exists():
        logo = Image(str(_LOGO), width=2.6 * cm, height=2.6 * cm)
        enc = Table([[logo, [titulo, sub]]], colWidths=[3 * cm, 13.5 * cm])
        enc.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
        el.append(enc)
    else:
        el.extend([titulo, sub])
    el.append(Spacer(1, 6))

    # 1. Datos del equipo
    el.append(Paragraph("1. DATOS DEL EQUIPO", est["seccion"]))
    el.append(
        _tabla_datos(
            [
                ["Identificación (Placa):", activo.placa_inventario or activo.codigo_interno, "Tipo de Equipo:", _tipo_equipo(activo)],
                ["Marca / Fabricante:", activo.marca or "", "Modelo:", activo.modelo or ""],
                ["Serie:", activo.serial or "", "Fecha de Asignación:", fecha],
            ],
            est["normal"],
            [4 * cm, 4.75 * cm, 4 * cm, 4.75 * cm],
        )
    )

    # 2. Datos del funcionario
    el.append(Paragraph("2. DATOS DEL FUNCIONARIO ASIGNADO", est["seccion"]))
    el.append(
        _tabla_datos(
            [
                ["Funcionario Responsable:", datos.funcionario_nombre or "", "Documento de Identidad:", datos.funcionario_documento or ""],
                ["Cargo:", datos.funcionario_cargo or "", "Dependencia / Ubicación:", datos.dependencia or ""],
                ["Correo Electrónico:", datos.correo or "", "Teléfono / Extensión:", datos.telefono or ""],
            ],
            est["normal"],
            [4 * cm, 4.75 * cm, 4 * cm, 4.75 * cm],
        )
    )

    # 3. Accesorios
    el.append(Paragraph("3. ACCESORIOS Y PERIFÉRICOS ENTREGADOS", est["seccion"]))
    enc_acc = ["Accesorio", "Entregado", "Marca / Serie", "Observaciones"]
    filas_acc = [[_celda(h, est["normal"]) for h in enc_acc]]
    for a in datos.accesorios:
        filas_acc.append(
            [
                _celda(a.nombre, est["normal"]),
                _celda("Sí" if a.entregado else "No", est["normal"]),
                _celda(a.marca_serie, est["normal"]),
                _celda(a.observaciones, est["normal"]),
            ]
        )
    t_acc = Table(filas_acc, colWidths=[5 * cm, 2.5 * cm, 5 * cm, 5 * cm])
    t_acc.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BACKGROUND", (0, 0), (-1, 0), _AZUL),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    el.append(t_acc)

    # 4. Estado
    el.append(Paragraph("4. ESTADO DEL EQUIPO AL MOMENTO DE LA ASIGNACIÓN", est["seccion"]))

    def _marca(valor: str) -> str:
        return "X" if (datos.estado_condicion or "").lower() == valor else "&nbsp;&nbsp;"

    el.append(
        Paragraph(
            f"Estado:&nbsp;&nbsp;&nbsp;Nuevo ( {_marca('nuevo')} )&nbsp;&nbsp;&nbsp;"
            f"Usado ( {_marca('usado')} )&nbsp;&nbsp;&nbsp;Reasignado ( {_marca('reasignado')} )",
            est["normal"],
        )
    )
    el.append(Spacer(1, 2))
    el.append(
        Paragraph(
            f"Observaciones del estado físico y funcional: {datos.observaciones_estado or ''}",
            est["normal"],
        )
    )

    # 5. Compromiso
    el.append(Paragraph("5. COMPROMISO Y RESPONSABILIDAD", est["seccion"]))
    el.append(Paragraph(_COMPROMISO, est["normal"]))

    # 6. Firmas
    el.append(Paragraph("6. FIRMAS", est["seccion"]))

    def _bloque_firma(titulo: str, nombre: str | None, cargo: str | None):
        return [
            _celda(f"<b>{titulo}</b>", est["normal"]),
            Spacer(1, 18),
            _celda("Firma: ___________________________", est["normal"]),
            _celda(f"Nombre: {nombre or '_________________________'}", est["normal"]),
            _celda(f"Cargo: {cargo or '__________________________'}", est["normal"]),
            _celda(f"Fecha: {fecha}", est["normal"]),
        ]

    firmas = Table(
        [[_bloque_firma("ENTREGA EL EQUIPO", datos.entrega_nombre, datos.entrega_cargo),
          _bloque_firma("RECIBE EL EQUIPO", datos.recibe_nombre, datos.recibe_cargo)]],
        colWidths=[8.25 * cm, 8.25 * cm],
    )
    firmas.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 8)]))
    el.append(Spacer(1, 6))
    el.append(firmas)

    doc.build(el)
    return buf.getvalue()


_ETIQUETA_MANT = {
    "verificacion": "Verificación",
    "preventivo": "Mantenimiento preventivo",
    "correctivo": "Mantenimiento correctivo",
    "seguimiento": "Seguimiento",
}


def generar_hoja_vida(
    activo,
    mantenimientos,
    *,
    sede_nombre: str | None = None,
    area_nombre: str | None = None,
    proveedor_nombre: str | None = None,
    responsable_nombre: str | None = None,
) -> bytes:
    est = _estilos()
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=letter, topMargin=1.2 * cm, bottomMargin=1.2 * cm,
        leftMargin=1.5 * cm, rightMargin=1.5 * cm,
    )
    el: list = []

    titulo = Paragraph("HOJA DE VIDA DEL EQUIPO TECNOLÓGICO", est["titulo"])
    sub = Paragraph(f"Código: {activo.codigo_interno}", est["pequeno"])
    if _LOGO.exists():
        logo = Image(str(_LOGO), width=2.6 * cm, height=2.6 * cm)
        enc = Table([[logo, [titulo, sub]]], colWidths=[3 * cm, 13.5 * cm])
        enc.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
        el.append(enc)
    else:
        el.extend([titulo, sub])
    el.append(Spacer(1, 6))

    ubicacion = " / ".join(x for x in [sede_nombre, area_nombre] if x) or ""

    el.append(Paragraph("DATOS DEL RECURSO TECNOLÓGICO", est["seccion"]))
    el.append(
        _tabla_datos(
            [
                ["Identificación (Placa):", activo.placa_inventario or activo.codigo_interno, "Dependencia / Ubicación:", ubicacion],
                ["Funcionario Responsable:", responsable_nombre or "", "Tipo de Equipo:", _tipo_equipo(activo)],
                ["Marca / Fabricante:", activo.marca or "", "Modelo:", activo.modelo or ""],
                ["Serie:", activo.serial or "", "Proveedor:", proveedor_nombre or ""],
                ["Fecha de Compra:", (activo.fecha_adquisicion.isoformat() if activo.fecha_adquisicion else ""), "Estado:", activo.estado or ""],
            ],
            est["normal"],
            [4 * cm, 4.75 * cm, 4 * cm, 4.75 * cm],
        )
    )

    el.append(Paragraph("CONFIGURACIÓN DE HARDWARE Y SOFTWARE", est["seccion"]))
    ram = " ".join(x for x in [activo.ram_capacidad, activo.ram_tipo] if x) or ""
    disco = " ".join(x for x in [activo.disco_tipo, activo.disco_capacidad] if x) or ""
    el.append(
        _tabla_datos(
            [
                ["Procesador:", activo.cpu or "", "Memoria RAM:", ram],
                ["Disco:", disco, "Sistema Operativo:", activo.sistema_operativo or ""],
                ["Hostname:", activo.hostname or "", "Dominio / Grupo:", activo.dominio or ""],
                ["IP:", activo.ip or "", "MAC:", activo.mac or ""],
            ],
            est["normal"],
            [4 * cm, 4.75 * cm, 4 * cm, 4.75 * cm],
        )
    )

    el.append(
        Paragraph(
            "BITÁCORA DE VERIFICACIONES, MANTENIMIENTOS Y SEGUIMIENTOS", est["seccion"]
        )
    )
    enc_b = ["Fecha", "Tipo", "Responsable", "Descripción de la actividad"]
    filas_b = [[_celda(h, est["normal"]) for h in enc_b]]
    for m in mantenimientos:
        filas_b.append(
            [
                _celda(m.fecha.isoformat() if m.fecha else "", est["normal"]),
                _celda(_ETIQUETA_MANT.get(m.tipo, m.tipo), est["normal"]),
                _celda(m.responsable, est["normal"]),
                _celda(m.descripcion, est["normal"]),
            ]
        )
    if not mantenimientos:
        filas_b.append([_celda("Sin registros de mantenimiento.", est["normal"]), "", "", ""])
    t_b = Table(filas_b, colWidths=[2.5 * cm, 3.5 * cm, 3.5 * cm, 8 * cm])
    t_b.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BACKGROUND", (0, 0), (-1, 0), _AZUL),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    el.append(t_b)

    doc.build(el)
    return buf.getvalue()
