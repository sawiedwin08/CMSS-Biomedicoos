"""Casos de uso de gestión de servicios (RF-004)."""
from app.application.dto.servicios import DatosServicio
from app.domain.entities.servicio import Servicio
from app.domain.exceptions import (
    NombreDuplicado,
    OperacionNoPermitida,
    RecursoNoEncontrado,
)
from app.domain.repositories.sede_repository import SedeRepository
from app.domain.repositories.servicio_repository import ServicioRepository


class ListarServicios:
    def __init__(self, servicios: ServicioRepository) -> None:
        self._servicios = servicios

    def ejecutar(self) -> list[Servicio]:
        return self._servicios.listar()


class CrearServicio:
    def __init__(
        self, servicios: ServicioRepository, sedes: SedeRepository
    ) -> None:
        self._servicios = servicios
        self._sedes = sedes

    def ejecutar(self, datos: DatosServicio) -> Servicio:
        if self._sedes.obtener_por_id(datos.sede_id) is None:
            raise RecursoNoEncontrado(f"La sede {datos.sede_id} no existe.")
        nombre = datos.nombre.strip()
        if self._servicios.existe_nombre(nombre, datos.sede_id):
            raise NombreDuplicado(
                f"Ya existe el servicio '{nombre}' en esa sede."
            )
        return self._servicios.crear(
            Servicio(nombre=nombre, sede_id=datos.sede_id, activo=datos.activo)
        )


class ActualizarServicio:
    def __init__(
        self, servicios: ServicioRepository, sedes: SedeRepository
    ) -> None:
        self._servicios = servicios
        self._sedes = sedes

    def ejecutar(self, servicio_id: int, datos: DatosServicio) -> Servicio:
        if self._servicios.obtener_por_id(servicio_id) is None:
            raise RecursoNoEncontrado(f"El servicio {servicio_id} no existe.")
        if self._sedes.obtener_por_id(datos.sede_id) is None:
            raise RecursoNoEncontrado(f"La sede {datos.sede_id} no existe.")
        nombre = datos.nombre.strip()
        if self._servicios.existe_nombre(
            nombre, datos.sede_id, excluir_id=servicio_id
        ):
            raise NombreDuplicado(
                f"Ya existe el servicio '{nombre}' en esa sede."
            )
        return self._servicios.actualizar(
            servicio_id, nombre, datos.sede_id, datos.activo
        )


class EliminarServicio:
    def __init__(self, servicios: ServicioRepository) -> None:
        self._servicios = servicios

    def ejecutar(self, servicio_id: int) -> None:
        if self._servicios.obtener_por_id(servicio_id) is None:
            raise RecursoNoEncontrado(f"El servicio {servicio_id} no existe.")
        if self._servicios.contar_equipos(servicio_id) > 0:
            raise OperacionNoPermitida(
                "No se puede eliminar un servicio que tiene equipos."
            )
        self._servicios.eliminar(servicio_id)
