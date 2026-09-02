"""Casos de uso de gestión de equipos — núcleo del Inventario (RF-001..007)."""
from app.application.dto.equipos import DatosEquipo, FiltroEquipos
from app.domain.entities.equipo import Equipo
from app.domain.exceptions import (
    NombreDuplicado,
    OperacionNoPermitida,
    RecursoNoEncontrado,
)
from app.domain.repositories.equipo_repository import EquipoRepository
from app.domain.repositories.proveedor_repository import ProveedorRepository
from app.domain.repositories.sede_repository import SedeRepository
from app.domain.repositories.servicio_repository import ServicioRepository


def _a_entidad(datos: DatosEquipo) -> Equipo:
    return Equipo(
        codigo_interno=(datos.codigo_interno or "").strip(),
        serial_fabricante=datos.serial_fabricante.strip(),
        nombre=datos.nombre.strip(),
        estado=datos.estado,
        marca=datos.marca,
        modelo=datos.modelo,
        criticidad=datos.criticidad,
        registro_invima=datos.registro_invima,
        clasificacion_riesgo=datos.clasificacion_riesgo,
        propiedad=datos.propiedad,
        sede_id=datos.sede_id,
        servicio_id=datos.servicio_id,
        proveedor_id=datos.proveedor_id,
        fecha_adquisicion=datos.fecha_adquisicion,
        costo_adquisicion=datos.costo_adquisicion,
        fin_garantia=datos.fin_garantia,
        orden_compra=datos.orden_compra,
    )


class _ValidadorReferencias:
    """Valida que sede/servicio/proveedor existan y sean coherentes (RF-004/005)."""

    def __init__(
        self,
        sedes: SedeRepository,
        servicios: ServicioRepository,
        proveedores: ProveedorRepository,
    ) -> None:
        self._sedes = sedes
        self._servicios = servicios
        self._proveedores = proveedores

    def validar(self, datos: DatosEquipo) -> None:
        if datos.sede_id is not None and self._sedes.obtener_por_id(datos.sede_id) is None:
            raise RecursoNoEncontrado(f"La sede {datos.sede_id} no existe.")

        if datos.servicio_id is not None:
            servicio = self._servicios.obtener_por_id(datos.servicio_id)
            if servicio is None:
                raise RecursoNoEncontrado(f"El servicio {datos.servicio_id} no existe.")
            if datos.sede_id is None:
                raise OperacionNoPermitida(
                    "Indica la sede del servicio seleccionado."
                )
            if servicio.sede_id != datos.sede_id:
                raise OperacionNoPermitida(
                    "El servicio no pertenece a la sede indicada."
                )

        if (
            datos.proveedor_id is not None
            and self._proveedores.obtener_por_id(datos.proveedor_id) is None
        ):
            raise RecursoNoEncontrado(f"El proveedor {datos.proveedor_id} no existe.")


class ListarEquipos:
    def __init__(self, equipos: EquipoRepository) -> None:
        self._equipos = equipos

    def ejecutar(self, filtro: FiltroEquipos) -> list[Equipo]:
        return self._equipos.listar(filtro)


class ObtenerEquipo:
    def __init__(self, equipos: EquipoRepository) -> None:
        self._equipos = equipos

    def ejecutar(self, equipo_id: int) -> Equipo:
        equipo = self._equipos.obtener_por_id(equipo_id)
        if equipo is None:
            raise RecursoNoEncontrado(f"El equipo {equipo_id} no existe.")
        return equipo


class CrearEquipo:
    def __init__(
        self,
        equipos: EquipoRepository,
        sedes: SedeRepository,
        servicios: ServicioRepository,
        proveedores: ProveedorRepository,
    ) -> None:
        self._equipos = equipos
        self._validador = _ValidadorReferencias(sedes, servicios, proveedores)

    def ejecutar(self, datos: DatosEquipo) -> Equipo:
        codigo = (datos.codigo_interno or "").strip()
        if codigo:
            # Código manual: debe ser único.
            if self._equipos.existe_codigo(codigo):
                raise NombreDuplicado(f"Ya existe un equipo con el código '{codigo}'.")
        else:
            # Vacío: el sistema lo genera (EQ-0001…).
            codigo = self._equipos.siguiente_codigo()
        self._validador.validar(datos)
        equipo = _a_entidad(datos)
        equipo.codigo_interno = codigo
        return self._equipos.crear(equipo)


class ActualizarEquipo:
    def __init__(
        self,
        equipos: EquipoRepository,
        sedes: SedeRepository,
        servicios: ServicioRepository,
        proveedores: ProveedorRepository,
    ) -> None:
        self._equipos = equipos
        self._validador = _ValidadorReferencias(sedes, servicios, proveedores)

    def ejecutar(self, equipo_id: int, datos: DatosEquipo) -> Equipo:
        if self._equipos.obtener_por_id(equipo_id) is None:
            raise RecursoNoEncontrado(f"El equipo {equipo_id} no existe.")
        codigo = (datos.codigo_interno or "").strip()
        if self._equipos.existe_codigo(codigo, excluir_id=equipo_id):
            raise NombreDuplicado(f"Ya existe un equipo con el código '{codigo}'.")
        self._validador.validar(datos)
        return self._equipos.actualizar(equipo_id, _a_entidad(datos))


class EliminarEquipo:
    def __init__(self, equipos: EquipoRepository) -> None:
        self._equipos = equipos

    def ejecutar(self, equipo_id: int) -> None:
        if self._equipos.obtener_por_id(equipo_id) is None:
            raise RecursoNoEncontrado(f"El equipo {equipo_id} no existe.")
        self._equipos.eliminar(equipo_id)
