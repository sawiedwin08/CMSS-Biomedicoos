"""Caso de uso: carga masiva de equipos desde filas de Excel (RF-008).

Procesa fila por fila: crea las válidas y reporta las inválidas con su motivo,
para que el usuario corrija y vuelva a subir sin duplicar lo ya importado.
"""
from datetime import date
from decimal import Decimal, InvalidOperation

from app.application.dto.equipos import DatosEquipo
from app.application.dto.importacion import ErrorFila, ResultadoImportacion
from app.application.use_cases.inventario.gestionar_equipos import CrearEquipo
from app.domain.enums.clase_biomedica import ClaseBiomedica
from app.domain.enums.clase_uso import ClaseUso
from app.domain.enums.clasificacion_riesgo import ClasificacionRiesgo
from app.domain.enums.estado_equipo import EstadoEquipo
from app.domain.enums.fuente_alimentacion import FuenteAlimentacion
from app.domain.enums.manual_tipo import ManualTipo
from app.domain.enums.modo_adquisicion import ModoAdquisicion
from app.domain.enums.plano_tipo import PlanoTipo
from app.domain.enums.propiedad import Propiedad
from app.domain.enums.tecnologia_predominante import TecnologiaPredominante
from app.domain.exceptions import DomainError
from app.domain.repositories.equipo_repository import EquipoRepository
from app.domain.repositories.proveedor_repository import ProveedorRepository
from app.domain.repositories.sede_repository import SedeRepository
from app.domain.repositories.servicio_repository import ServicioRepository

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


def _parse_lista(valor: str | None, enum_cls, etiqueta: str) -> list[str]:
    """Divide una celda por ';' y valida cada elemento contra el vocabulario."""
    if not valor:
        return []
    resultado: list[str] = []
    for parte in valor.split(";"):
        parte = parte.strip()
        if not parte:
            continue
        miembro = _parse_enum(parte, enum_cls, etiqueta)
        if miembro.value not in resultado:
            resultado.append(miembro.value)
    return resultado


def _parse_texto_lista(valor: str | None) -> list[str]:
    """Divide una celda de texto libre por ';' (sin validación de vocabulario)."""
    if not valor:
        return []
    return [p.strip() for p in valor.split(";") if p.strip()]


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
                    if s.sede_id == sede_id and s.nombre.lower() == v["servicio"].lower()
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
            codigo_interno=v.get("codigo_interno"),
            serial_fabricante=v["serial_fabricante"],
            nombre=v["nombre"],
            estado=estado,
            marca=v.get("marca"),
            modelo=v.get("modelo"),
            numero_activo=v.get("numero_activo"),
            sede_id=sede_id,
            servicio_id=servicio_id,
            piso=v.get("piso"),
            clase_biomedica=_parse_enum(v.get("clase_biomedica"), ClaseBiomedica, "Clase biomédica"),
            clase_uso=_parse_enum(v.get("clase_uso"), ClaseUso, "Clase de uso"),
            clasificacion_riesgo=_parse_enum(
                v.get("clasificacion_riesgo"), ClasificacionRiesgo, "Clasificación de riesgo"
            ),
            tecnologia_predominante=_parse_enum(
                v.get("tecnologia_predominante"), TecnologiaPredominante, "Tecnología predominante"
            ),
            fabricante=v.get("fabricante"),
            anio_fabricacion=_parse_int(v.get("anio_fabricacion"), "Año de fabricación"),
            pais_fabricante=v.get("pais_fabricante"),
            ciudad_fabricante=v.get("ciudad_fabricante"),
            direccion_fabricante=v.get("direccion_fabricante"),
            telefono_fabricante=v.get("telefono_fabricante"),
            correo_fabricante=v.get("correo_fabricante"),
            representante=v.get("representante"),
            pais_representante=v.get("pais_representante"),
            ciudad_representante=v.get("ciudad_representante"),
            direccion_representante=v.get("direccion_representante"),
            telefono_representante=v.get("telefono_representante"),
            correo_representante=v.get("correo_representante"),
            voltaje_operacion=v.get("voltaje_operacion"),
            voltaje_maximo=v.get("voltaje_maximo"),
            corriente_maxima=v.get("corriente_maxima"),
            corriente_minima=v.get("corriente_minima"),
            potencia_consumida=v.get("potencia_consumida"),
            frecuencia=v.get("frecuencia"),
            presion=v.get("presion"),
            velocidad=v.get("velocidad"),
            temperatura=v.get("temperatura"),
            peso=v.get("peso"),
            capacidad=v.get("capacidad"),
            fuentes_alimentacion=_parse_lista(
                v.get("fuentes_alimentacion"), FuenteAlimentacion, "Fuente de alimentación"
            ),
            manuales=_parse_lista(v.get("manuales"), ManualTipo, "Manuales"),
            planos=_parse_lista(v.get("planos"), PlanoTipo, "Planos"),
            recomendaciones_fabricante=_parse_texto_lista(v.get("recomendaciones_fabricante")),
            modo_adquisicion=_parse_enum(
                v.get("modo_adquisicion"), ModoAdquisicion, "Modo de adquisición"
            ),
            propiedad=_parse_enum(v.get("propiedad"), Propiedad, "Propiedad"),
            proveedor_id=proveedor_id,
            fecha_adquisicion=_parse_fecha(v.get("fecha_adquisicion"), "Fecha de adquisición"),
            costo_adquisicion=_parse_decimal(v.get("costo_adquisicion")),
            orden_compra=v.get("orden_compra"),
            fecha_inicial_garantia=_parse_fecha(
                v.get("fecha_inicial_garantia"), "Fecha inicial garantía"
            ),
            fecha_final_garantia=_parse_fecha(
                v.get("fecha_final_garantia"), "Fecha final garantía"
            ),
            fecha_instalacion=_parse_fecha(v.get("fecha_instalacion"), "Fecha instalación"),
            fecha_funcionamiento=_parse_fecha(
                v.get("fecha_funcionamiento"), "Fecha funcionamiento"
            ),
            registro_invima=v.get("registro_invima"),
            fecha_vencimiento_invima=_parse_fecha(
                v.get("fecha_vencimiento_invima"), "Fecha vencimiento INVIMA"
            ),
            periodicidad_mantenimiento=v.get("periodicidad_mantenimiento"),
            calibracion_si=_parse_bool(v.get("calibracion_si")),
            calibracion_no=_parse_bool(v.get("calibracion_no")),
            equipo_movil=_parse_bool(v.get("equipo_movil")),
            equipo_fijo=_parse_bool(v.get("equipo_fijo")),
            accesorios=v.get("accesorios"),
            descripcion_funcional=v.get("descripcion_funcional"),
        )
