"""Casos de uso de gestión de sedes (RF-004)."""
from app.application.dto.sedes import DatosSede
from app.domain.entities.sede import Sede
from app.domain.exceptions import (
    NombreDuplicado,
    OperacionNoPermitida,
    RecursoNoEncontrado,
)
from app.domain.repositories.sede_repository import SedeRepository


class ListarSedes:
    def __init__(self, sedes: SedeRepository) -> None:
        self._sedes = sedes

    def ejecutar(self) -> list[Sede]:
        return self._sedes.listar()


class CrearSede:
    def __init__(self, sedes: SedeRepository) -> None:
        self._sedes = sedes

    def ejecutar(self, datos: DatosSede) -> Sede:
        nombre = datos.nombre.strip()
        if self._sedes.existe_nombre(nombre):
            raise NombreDuplicado(f"Ya existe una sede llamada '{nombre}'.")
        return self._sedes.crear(
            Sede(
                nombre=nombre,
                direccion=datos.direccion,
                ciudad=datos.ciudad,
                activo=datos.activo,
            )
        )


class ActualizarSede:
    def __init__(self, sedes: SedeRepository) -> None:
        self._sedes = sedes

    def ejecutar(self, sede_id: int, datos: DatosSede) -> Sede:
        if self._sedes.obtener_por_id(sede_id) is None:
            raise RecursoNoEncontrado(f"La sede {sede_id} no existe.")
        nombre = datos.nombre.strip()
        if self._sedes.existe_nombre(nombre, excluir_id=sede_id):
            raise NombreDuplicado(f"Ya existe una sede llamada '{nombre}'.")
        return self._sedes.actualizar(
            sede_id, nombre, datos.direccion, datos.ciudad, datos.activo
        )


class EliminarSede:
    def __init__(self, sedes: SedeRepository) -> None:
        self._sedes = sedes

    def ejecutar(self, sede_id: int) -> None:
        if self._sedes.obtener_por_id(sede_id) is None:
            raise RecursoNoEncontrado(f"La sede {sede_id} no existe.")
        if self._sedes.contar_servicios(sede_id) > 0:
            raise OperacionNoPermitida(
                "No se puede eliminar una sede que tiene servicios."
            )
        if self._sedes.contar_equipos(sede_id) > 0:
            raise OperacionNoPermitida(
                "No se puede eliminar una sede que tiene equipos."
            )
        self._sedes.eliminar(sede_id)
