"""Carga masiva (y exportación) de activos de TI desde/hacia Excel.

Procesa fila por fila: crea las válidas y reporta las inválidas con su motivo,
para que el usuario corrija y vuelva a subir sin duplicar lo ya importado.
"""
from datetime import date
from decimal import Decimal, InvalidOperation

from app.application.dto.activos import DatosActivo
from app.application.dto.importacion import ErrorFila, ResultadoImportacion
from app.application.use_cases.sistemas.gestionar_activos import CrearActivo
from app.domain.entities.activo import Activo
from app.domain.enums.activos import (
    CategoriaActivo,
    EstadoActivo,
    TipoComputo,
    TipoPeriferico,
    TipoRed,
)
from app.domain.exceptions import DomainError
from app.domain.repositories.activo_repository import ActivoRepository
from app.domain.repositories.proveedor_repository import ProveedorRepository
from app.domain.repositories.sede_repository import SedeRepository
from app.domain.repositories.servicio_repository import ServicioRepository
from app.domain.repositories.usuario_repository import UsuarioRepository

_VERDADEROS = {"si", "sí", "s", "true", "1", "x", "yes", "verdadero"}


class _ErrorFila(Exception):
    """Error de validación de una fila (mensaje legible para el usuario)."""


def _parse_enum(valor: str | None, enum_cls, etiqueta: str):
    if not valor:
        return None
    for miembro in enum_cls:
        if miembro.value.lower() == valor.strip().lower():
            return miembro
    validos = ", ".join(m.value for m in enum_cls)
    raise _ErrorFila(f"{etiqueta} inválido: '{valor}'. Valores: {validos}.")


def _parse_bool(valor: str | None) -> bool:
    return bool(valor) and valor.strip().lower() in _VERDADEROS


def _parse_int(valor: str | None, etiqueta: str) -> int | None:
    if not valor:
        return None
    try:
        return int(float(valor))
    except (ValueError, TypeError) as exc:
        raise _ErrorFila(f"{etiqueta} inválido: '{valor}'.") from exc


def _parse_fecha(valor: str | None, etiqueta: str) -> date | None:
    if not valor:
        return None
    try:
        return date.fromisoformat(valor[:10])
    except ValueError as exc:
        raise _ErrorFila(f"{etiqueta} inválida: '{valor}' (use AAAA-MM-DD).") from exc


def _parse_decimal(valor: str | None) -> Decimal | None:
    if not valor:
        return None
    try:
        return Decimal(valor.replace(",", ""))
    except (InvalidOperation, ValueError) as exc:
        raise _ErrorFila(f"Costo inválido: '{valor}'.") from exc


class ImportarActivos:
    def __init__(
        self,
        activos: ActivoRepository,
        sedes: SedeRepository,
        areas: ServicioRepository,
        proveedores: ProveedorRepository,
        usuarios: UsuarioRepository,
    ) -> None:
        self._crear = CrearActivo(activos, sedes, areas, proveedores, usuarios)
        self._sedes = sedes
        self._areas = areas
        self._proveedores = proveedores

    def ejecutar(
        self, filas: list[tuple[int, dict[str, str | None]]]
    ) -> ResultadoImportacion:
        sedes = {s.nombre.lower(): s for s in self._sedes.listar()}
        areas = self._areas.listar()
        proveedores = {p.nombre.lower(): p.id for p in self._proveedores.listar()}

        resultado = ResultadoImportacion(total=len(filas))
        for numero, v in filas:
            try:
                datos = self._construir(v, sedes, areas, proveedores)
                self._crear.ejecutar(datos)
                resultado.creados += 1
            except (_ErrorFila, DomainError) as exc:
                resultado.errores.append(ErrorFila(fila=numero, mensaje=str(exc)))
        return resultado

    def _construir(self, v: dict[str, str | None], sedes, areas, proveedores) -> DatosActivo:
        categoria = _parse_enum(v.get("categoria"), CategoriaActivo, "Categoría")
        if categoria is None:
            raise _ErrorFila("Falta el campo obligatorio 'categoria' (computo/red/periferico).")
        if not v.get("nombre"):
            raise _ErrorFila("Falta el campo obligatorio 'nombre'.")

        sede_id = None
        if v.get("sede"):
            sede = sedes.get(v["sede"].lower())
            if sede is None:
                raise _ErrorFila(f"La sede '{v['sede']}' no existe.")
            sede_id = sede.id

        area_id = None
        if v.get("area"):
            if sede_id is None:
                raise _ErrorFila("Se indicó área pero no sede.")
            match = next(
                (
                    a
                    for a in areas
                    if a.sede_id == sede_id and a.nombre.lower() == v["area"].lower()
                ),
                None,
            )
            if match is None:
                raise _ErrorFila(
                    f"El área '{v['area']}' no existe en la sede '{v['sede']}'."
                )
            area_id = match.id

        proveedor_id = None
        if v.get("proveedor"):
            proveedor_id = proveedores.get(v["proveedor"].lower())
            if proveedor_id is None:
                raise _ErrorFila(f"El proveedor '{v['proveedor']}' no existe.")

        estado = _parse_enum(v.get("estado"), EstadoActivo, "Estado") or EstadoActivo.OPERATIVO

        return DatosActivo(
            codigo_interno=v.get("codigo_interno") or "",
            categoria=categoria,
            nombre=v["nombre"],
            estado=estado,
            marca=v.get("marca"),
            modelo=v.get("modelo"),
            serial=v.get("serial"),
            placa_inventario=v.get("placa_inventario"),
            sede_id=sede_id,
            area_id=area_id,
            piso=v.get("piso"),
            proveedor_id=proveedor_id,
            costo=_parse_decimal(v.get("costo")),
            orden_compra=v.get("orden_compra"),
            factura=v.get("factura"),
            fecha_adquisicion=_parse_fecha(v.get("fecha_adquisicion"), "Fecha de adquisición"),
            garantia_inicio=_parse_fecha(v.get("garantia_inicio"), "Garantía inicio"),
            garantia_fin=_parse_fecha(v.get("garantia_fin"), "Garantía fin"),
            observaciones=v.get("observaciones"),
            ip=v.get("ip"),
            mac=v.get("mac"),
            # Cómputo
            tipo_computo=_parse_enum(v.get("tipo_computo"), TipoComputo, "Tipo cómputo"),
            hostname=v.get("hostname"),
            cpu=v.get("cpu"),
            ram_capacidad=v.get("ram_capacidad"),
            ram_tipo=v.get("ram_tipo"),
            disco_tipo=v.get("disco_tipo"),
            disco_capacidad=v.get("disco_capacidad"),
            sistema_operativo=v.get("sistema_operativo"),
            dominio=v.get("dominio"),
            inc_teclado=_parse_bool(v.get("inc_teclado")),
            inc_mouse=_parse_bool(v.get("inc_mouse")),
            inc_cable_poder=_parse_bool(v.get("inc_cable_poder")),
            inc_cable_video=_parse_bool(v.get("inc_cable_video")),
            accesorios_otro=v.get("accesorios_otro"),
            # Red
            tipo_red=_parse_enum(v.get("tipo_red"), TipoRed, "Tipo red"),
            num_puertos=_parse_int(v.get("num_puertos"), "Nº de puertos"),
            poe=_parse_bool(v.get("poe")),
            firmware=v.get("firmware"),
            ubicacion_fisica=v.get("ubicacion_fisica"),
            config_notas=v.get("config_notas"),
            # Periférico
            tipo_periferico=_parse_enum(
                v.get("tipo_periferico"), TipoPeriferico, "Tipo periférico"
            ),
            monitor_pulgadas=v.get("monitor_pulgadas"),
            monitor_resolucion=v.get("monitor_resolucion"),
            impresora_tecnologia=v.get("impresora_tecnologia"),
            impresora_conexion=v.get("impresora_conexion"),
        )


def _si_no(valor: bool) -> str:
    return "Sí" if valor else "No"


def filas_para_export(
    activos: list[Activo],
    sedes: SedeRepository,
    areas: ServicioRepository,
    proveedores: ProveedorRepository,
) -> list[dict[str, str | None]]:
    """Convierte activos en filas con claves de COLUMNAS (referencias por nombre)."""
    sede_nombre = {s.id: s.nombre for s in sedes.listar()}
    area_nombre = {a.id: a.nombre for a in areas.listar()}
    prov_nombre = {p.id: p.nombre for p in proveedores.listar()}

    def fecha(d) -> str:
        return d.isoformat() if d else ""

    filas: list[dict[str, str | None]] = []
    for a in activos:
        filas.append(
            {
                "categoria": a.categoria,
                "codigo_interno": a.codigo_interno,
                "nombre": a.nombre,
                "estado": a.estado,
                "marca": a.marca,
                "modelo": a.modelo,
                "serial": a.serial,
                "placa_inventario": a.placa_inventario,
                "sede": sede_nombre.get(a.sede_id, "") if a.sede_id else "",
                "area": area_nombre.get(a.area_id, "") if a.area_id else "",
                "piso": a.piso,
                "ip": a.ip,
                "mac": a.mac,
                "fecha_adquisicion": fecha(a.fecha_adquisicion),
                "proveedor": prov_nombre.get(a.proveedor_id, "") if a.proveedor_id else "",
                "costo": str(a.costo) if a.costo is not None else "",
                "orden_compra": a.orden_compra,
                "factura": a.factura,
                "garantia_inicio": fecha(a.garantia_inicio),
                "garantia_fin": fecha(a.garantia_fin),
                "observaciones": a.observaciones,
                "tipo_computo": a.tipo_computo,
                "hostname": a.hostname,
                "cpu": a.cpu,
                "ram_capacidad": a.ram_capacidad,
                "ram_tipo": a.ram_tipo,
                "disco_tipo": a.disco_tipo,
                "disco_capacidad": a.disco_capacidad,
                "sistema_operativo": a.sistema_operativo,
                "dominio": a.dominio,
                "inc_teclado": _si_no(a.inc_teclado),
                "inc_mouse": _si_no(a.inc_mouse),
                "inc_cable_poder": _si_no(a.inc_cable_poder),
                "inc_cable_video": _si_no(a.inc_cable_video),
                "accesorios_otro": a.accesorios_otro,
                "tipo_red": a.tipo_red,
                "num_puertos": str(a.num_puertos) if a.num_puertos is not None else "",
                "poe": _si_no(a.poe),
                "firmware": a.firmware,
                "ubicacion_fisica": a.ubicacion_fisica,
                "config_notas": a.config_notas,
                "tipo_periferico": a.tipo_periferico,
                "monitor_pulgadas": a.monitor_pulgadas,
                "monitor_resolucion": a.monitor_resolucion,
                "impresora_tecnologia": a.impresora_tecnologia,
                "impresora_conexion": a.impresora_conexion,
            }
        )
    return filas
