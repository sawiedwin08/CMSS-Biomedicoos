"""Casos de uso de gestión de roles (RF-028, RF-029)."""
from app.application.dto.roles import DatosActualizarRol, DatosNuevoRol
from app.domain.entities.rol import Rol
from app.domain.exceptions import (
    NombreDuplicado,
    OperacionNoPermitida,
    RecursoNoEncontrado,
)
from app.domain.repositories.permiso_repository import PermisoRepository
from app.domain.repositories.rol_repository import RolRepository


class ListarRoles:
    def __init__(self, roles: RolRepository) -> None:
        self._roles = roles

    def ejecutar(self) -> list[Rol]:
        return self._roles.listar()


class CrearRol:
    def __init__(self, roles: RolRepository, permisos: PermisoRepository) -> None:
        self._roles = roles
        self._permisos = permisos

    def ejecutar(self, datos: DatosNuevoRol) -> Rol:
        nombre = datos.nombre.strip()
        if self._roles.existe_nombre(nombre):
            raise NombreDuplicado(f"Ya existe un rol llamado '{nombre}'.")
        if datos.permiso_ids and not self._permisos.existen_ids(datos.permiso_ids):
            raise RecursoNoEncontrado("Uno o más permisos no existen.")
        return self._roles.crear(nombre, datos.descripcion, datos.permiso_ids)


class ActualizarRol:
    def __init__(self, roles: RolRepository) -> None:
        self._roles = roles

    def ejecutar(self, rol_id: int, datos: DatosActualizarRol) -> Rol:
        rol = self._roles.obtener_por_id(rol_id)
        if rol is None:
            raise RecursoNoEncontrado(f"El rol {rol_id} no existe.")

        nombre = datos.nombre.strip()
        # Los roles de sistema conservan su nombre; solo se edita la descripción.
        if rol.es_sistema:
            nombre = rol.nombre
        elif nombre != rol.nombre and self._roles.existe_nombre(nombre):
            raise NombreDuplicado(f"Ya existe un rol llamado '{nombre}'.")

        return self._roles.actualizar(rol_id, nombre, datos.descripcion)


class EstablecerPermisosRol:
    def __init__(self, roles: RolRepository, permisos: PermisoRepository) -> None:
        self._roles = roles
        self._permisos = permisos

    def ejecutar(self, rol_id: int, permiso_ids: list[int]) -> Rol:
        if self._roles.obtener_por_id(rol_id) is None:
            raise RecursoNoEncontrado(f"El rol {rol_id} no existe.")
        if permiso_ids and not self._permisos.existen_ids(permiso_ids):
            raise RecursoNoEncontrado("Uno o más permisos no existen.")
        return self._roles.establecer_permisos(rol_id, permiso_ids)


class EliminarRol:
    def __init__(self, roles: RolRepository) -> None:
        self._roles = roles

    def ejecutar(self, rol_id: int) -> None:
        rol = self._roles.obtener_por_id(rol_id)
        if rol is None:
            raise RecursoNoEncontrado(f"El rol {rol_id} no existe.")
        if rol.es_sistema:
            raise OperacionNoPermitida("No se puede eliminar un rol de sistema.")
        if self._roles.contar_usuarios(rol_id) > 0:
            raise OperacionNoPermitida(
                "No se puede eliminar un rol que tiene usuarios asignados."
            )
        self._roles.eliminar(rol_id)
