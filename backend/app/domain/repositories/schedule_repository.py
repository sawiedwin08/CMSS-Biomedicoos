"""Contrato de Repositorio - Schedule (Módulo Tardanzas - RF-031)."""
from abc import ABC, abstractmethod

from app.domain.entities.schedule import Schedule


class ScheduleRepository(ABC):
    @abstractmethod
    def listar(self) -> list[Schedule]:
        """Listar todos los horarios activos."""
        pass

    @abstractmethod
    def listar_por_departamento(self, department_id: int) -> list[Schedule]:
        """Listar horarios activos de un departamento."""
        pass

    @abstractmethod
    def obtener_por_id(self, schedule_id: int) -> Schedule | None:
        """Obtener un horario por ID (con sus bloques)."""
        pass

    @abstractmethod
    def crear(self, schedule: Schedule) -> Schedule:
        """Crear un nuevo horario."""
        pass

    @abstractmethod
    def actualizar(self, schedule_id: int, datos: Schedule) -> Schedule:
        """Actualizar un horario existente."""
        pass

    @abstractmethod
    def cambiar_estado(self, schedule_id: int, es_activo: bool) -> Schedule:
        """Cambiar el estado activo/inactivo de un horario."""
        pass

    @abstractmethod
    def eliminar(self, schedule_id: int) -> None:
        """Marcar un horario como eliminado (soft delete)."""
        pass

    @abstractmethod
    def restaurar(self, schedule_id: int) -> Schedule:
        """Restaurar un horario eliminado."""
        pass
