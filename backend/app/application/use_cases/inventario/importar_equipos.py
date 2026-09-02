"""Caso de uso: carga masiva de equipos desde filas de Excel (RF-008).

Procesa fila por fila: crea las válidas y reporta las inválidas con su motivo,
para que el usuario corrija y vuelva a subir sin duplicar lo ya importado.
"""
from datetime import date
from decimal import Decimal, InvalidOperation

from app.application.dto.equipos import DatosEquipo
from app.application.dto.importacion import ErrorFila, ResultadoImportacion
from app.application.use_cases.inventario.gestionar_equipos import CrearEquipo
from app.domain.enums.clasificacion_riesgo import ClasificacionRiesgo
from app.domain.enums.criticidad import Criticidad
from app.domain.enums.estado_equipo import EstadoEquipo
from app.domain.enums.propiedad import Propiedad
from app.domain.exceptions import DomainError
from app.domain.repositories.equipo_repository import EquipoRepository
from app.domain.repositories.proveedor_repository import ProveedorRepository
from app.domain.repositories.sede_repository import SedeRepository
from app.domain.repositories.servicio_repository import ServicioRepository


class _ErrorFila(Exception):
    """Error de validación de una fila (mensaje legible para el usuario)."""


def _parse_enum(valor: str | None, enum_cls, etiqueta: str):
    if not valor:
        return None
    for miembro in enum_cls:
        if miembro.value.lower() == valor.lower():
            return miembro
    validos = ", ".join(m.value for m in enum_cls)
    raise _ErrorFila(f"{etiqueta} inválido: '{valor}'. Valores: {validos}.")


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


class ImportarEquipos:
    def __init__(
        self,
        equipos: EquipoRepository,
        sedes: SedeRepository,
        servicios: ServicioRepository,
        proveedores: ProveedorRepository,
    ) -> None:
        self._crear = CrearEquipo(equipos, sedes, servicios, proveedores)
        self._sedes = sedes
        self._servicios = servicios
        self._proveedores = proveedores

    def ejecutar(
        self, filas: list[tuple[int, dict[str, str | None]]]
    ) -> ResultadoImportacion:
        # Mapas nombre -> id (búsqueda tolerante a mayúsculas).
        sedes = {s.nombre.lower(): s for s in self._sedes.listar()}
        servicios = self._servicios.listar()
        proveedores = {p.nombre.lower(): p.id for p in self._proveedores.listar()}

        resultado = ResultadoImportacion(total=len(filas))
        for numero, v in filas:
            try:
                datos = self._construir(v, sedes, servicios, proveedores)
                self._crear.ejecutar(datos)
                resultado.creados += 1
            except (_ErrorFila, DomainError) as exc:
                resultado.errores.append(ErrorFila(fila=numero, mensaje=str(exc)))
        return resultado

    def _construir(
        self, v: dict[str, str | None], sedes, servicios, proveedores
    ) -> DatosEquipo:
        # codigo_interno es opcional: si viene vacío, se autogenera.
        for req in ("serial_fabricante", "nombre"):
            if not v.get(req):
                raise _ErrorFila(f"Falta el campo obligatorio '{req}'.")

        # Resolver sede
        sede_id = None
        sede = None
        if v.get("sede"):
            sede = sedes.get(v["sede"].lower())
            if sede is None:
                raise _ErrorFila(f"La sede '{v['sede']}' no existe.")
            sede_id = sede.id

        # Resolver servicio (dentro de la sede)
        servicio_id = None
        if v.get("servicio"):
            if sede_id is None:
                raise _ErrorFila("Se indicó servicio pero no sede.")
            match = next(
                (
                    s
                    for s in servicios
                    if s.sede_id == sede_id
                    and s.nombre.lower() == v["servicio"].lower()
                ),
                None,
            )
            if match is None:
                raise _ErrorFila(
                    f"El servicio '{v['servicio']}' no existe en la sede '{v['sede']}'."
                )
            servicio_id = match.id

        # Resolver proveedor
        proveedor_id = None
        if v.get("proveedor"):
            proveedor_id = proveedores.get(v["proveedor"].lower())
            if proveedor_id is None:
                raise _ErrorFila(f"El proveedor '{v['proveedor']}' no existe.")

        estado = _parse_enum(v.get("estado"), EstadoEquipo, "Estado") or EstadoEquipo.OPERATIVO

        return DatosEquipo(
            codigo_interno=v["codigo_interno"],
            serial_fabricante=v["serial_fabricante"],
            nombre=v["nombre"],
            estado=estado,
            marca=v.get("marca"),
            modelo=v.get("modelo"),
            criticidad=_parse_enum(v.get("criticidad"), Criticidad, "Criticidad"),
            registro_invima=v.get("registro_invima"),
            clasificacion_riesgo=_parse_enum(
                v.get("clasificacion_riesgo"), ClasificacionRiesgo, "Clasificación de riesgo"
            ),
            propiedad=_parse_enum(v.get("propiedad"), Propiedad, "Propiedad"),
            sede_id=sede_id,
            servicio_id=servicio_id,
            proveedor_id=proveedor_id,
            fecha_adquisicion=_parse_fecha(v.get("fecha_adquisicion"), "Fecha de adquisición"),
            costo_adquisicion=_parse_decimal(v.get("costo_adquisicion")),
            fin_garantia=_parse_fecha(v.get("fin_garantia"), "Fin de garantía"),
            orden_compra=v.get("orden_compra"),
        )
