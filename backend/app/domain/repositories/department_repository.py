"""Contrato de Repositorio - Department (Módulo Tardanzas - RF-031)."""
from abc import ABC, abstractmethod

from app.domain.entities.department import Department


class DepartmentRepository(ABC):
    @abstractmethod
    def listar(self) -> list[Department]:
        """Listar todos los departamentos activos."""
        pass

    @abstractmethod
    def listar_con_eliminados(self) -> list[Department]:
        """Listar todos los departamentos (incluyendo eliminados)."""
        pass

    @abstractmethod
    def obtener_por_id(self, department_id: int) -> Department | None:
        """Obtener un departamento por ID."""
        pass

    @abstractmethod
    def obtener_por_nombre(self, nombre: str) -> Department | None:
        """Obtener un departamento por nombre."""
        pass

    @abstractmethod
    def existe_nombre(self, nombre: str, excluir_id: int | None = None) -> bool:
        """Verificar si existe un departamento con ese nombre."""
        pass

    @abstractmethod
    def crear(self, department: Department) -> Department:
        """Crear un nuevo departamento."""
        pass

    @abstractmethod
    def actualizar(self, department_id: int, datos: Department) -> Department:
        """Actualizar un departamento existente."""
        pass

    @abstractmethod
    def cambiar_estado(self, department_id: int, es_activo: bool) -> Department:
        """Cambiar el estado activo/inactivo de un departamento."""
        pass

    @abstractmethod
    def eliminar(self, department_id: int) -> None:
        """Marcar un departamento como eliminado (soft delete)."""
        pass

    @abstractmethod
    def restaurar(self, department_id: int) -> Department:
        """Restaurar un departamento eliminado."""
        pass
