"""Casos de uso de gestión de departamentos (Módulo Tardanzas - RF-031)."""
from app.application.dto.tardanzas import DatosDepartamento
from app.domain.entities.department import Department
from app.domain.exceptions import NombreDuplicado, OperacionNoPermitida, RecursoNoEncontrado
from app.domain.repositories.department_repository import DepartmentRepository


def _a_entidad(datos: DatosDepartamento) -> Department:
    return Department(
        id=None,
        name=datos.nombre.strip(),
        is_active=datos.activo,
        notes=datos.notas,
    )


class ListarDepartamentos:
    def __init__(self, departamentos: DepartmentRepository) -> None:
        self._departamentos = departamentos

    def ejecutar(self) -> list[Department]:
        return self._departamentos.listar()


class ListarDepartamentosConEliminados:
    def __init__(self, departamentos: DepartmentRepository) -> None:
        self._departamentos = departamentos

    def ejecutar(self) -> list[Department]:
        return self._departamentos.listar_con_eliminados()


class ObtenerDepartamento:
    def __init__(self, departamentos: DepartmentRepository) -> None:
        self._departamentos = departamentos

    def ejecutar(self, department_id: int) -> Department:
        dept = self._departamentos.obtener_por_id(department_id)
        if not dept:
            raise RecursoNoEncontrado(f"El departamento {department_id} no existe.")
        return dept


class CrearDepartamento:
    def __init__(self, departamentos: DepartmentRepository) -> None:
        self._departamentos = departamentos

    def ejecutar(self, datos: DatosDepartamento) -> Department:
        nombre = datos.nombre.strip()
        if self._departamentos.existe_nombre(nombre):
            raise NombreDuplicado(f"Ya existe un departamento llamado '{nombre}'.")
        return self._departamentos.crear(_a_entidad(datos))


class ActualizarDepartamento:
    def __init__(self, departamentos: DepartmentRepository) -> None:
        self._departamentos = departamentos

    def ejecutar(self, department_id: int, datos: DatosDepartamento) -> Department:
        if self._departamentos.obtener_por_id(department_id) is None:
            raise RecursoNoEncontrado(f"El departamento {department_id} no existe.")
        nombre = datos.nombre.strip()
        if self._departamentos.existe_nombre(nombre, excluir_id=department_id):
            raise NombreDuplicado(f"Ya existe un departamento llamado '{nombre}'.")
        return self._departamentos.actualizar(department_id, _a_entidad(datos))


class CambiarEstadoDepartamento:
    def __init__(self, departamentos: DepartmentRepository) -> None:
        self._departamentos = departamentos

    def ejecutar(self, department_id: int, es_activo: bool) -> Department:
        dept = self._departamentos.obtener_por_id(department_id)
        if not dept:
            raise RecursoNoEncontrado(f"El departamento {department_id} no existe.")
        return self._departamentos.cambiar_estado(department_id, es_activo)


class EliminarDepartamento:
    def __init__(self, departamentos: DepartmentRepository) -> None:
        self._departamentos = departamentos

    def ejecutar(self, department_id: int) -> None:
        if self._departamentos.obtener_por_id(department_id) is None:
            raise RecursoNoEncontrado(f"El departamento {department_id} no existe.")
        self._departamentos.eliminar(department_id)


class RestaurarDepartamento:
    def __init__(self, departamentos: DepartmentRepository) -> None:
        self._departamentos = departamentos

    def ejecutar(self, department_id: int) -> Department:
        dept = self._departamentos.obtener_por_id(department_id)
        if not dept:
            raise RecursoNoEncontrado(f"El departamento {department_id} no existe.")
        return self._departamentos.restaurar(department_id)
