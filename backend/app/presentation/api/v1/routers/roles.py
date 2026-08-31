"""Router de gestión de roles y sus permisos (RF-028, RF-029)."""
from fastapi import APIRouter, Depends, status

from app.application.dto.roles import DatosActualizarRol, DatosNuevoRol
from app.application.use_cases.roles.gestionar_roles import (
    ActualizarRol,
    CrearRol,
    EliminarRol,
    EstablecerPermisosRol,
    ListarRoles,
)
from app.presentation.api.deps import PermisoRepo, RolRepo, require_permiso
from app.presentation.schemas.roles import (
    RolCreate,
    RolPermisosUpdate,
    RolRead,
    RolUpdate,
)

router = APIRouter(prefix="/roles", tags=["Roles y permisos"])


@router.get(
    "",
    response_model=list[RolRead],
    summary="Listar roles",
    dependencies=[Depends(require_permiso("roles:ver"))],
)
def listar_roles(roles: RolRepo) -> list[RolRead]:
    return [RolRead.model_validate(r) for r in ListarRoles(roles).ejecutar()]


@router.post(
    "",
    response_model=RolRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear rol",
    dependencies=[Depends(require_permiso("roles:crear"))],
)
def crear_rol(datos: RolCreate, roles: RolRepo, permisos: PermisoRepo) -> RolRead:
    creado = CrearRol(roles, permisos).ejecutar(
        DatosNuevoRol(
            nombre=datos.nombre,
            descripcion=datos.descripcion,
            permiso_ids=datos.permiso_ids,
        )
    )
    return RolRead.model_validate(creado)


@router.put(
    "/{rol_id}",
    response_model=RolRead,
    summary="Editar nombre / descripción de un rol",
    dependencies=[Depends(require_permiso("roles:editar"))],
)
def actualizar_rol(rol_id: int, datos: RolUpdate, roles: RolRepo) -> RolRead:
    actualizado = ActualizarRol(roles).ejecutar(
        rol_id, DatosActualizarRol(nombre=datos.nombre, descripcion=datos.descripcion)
    )
    return RolRead.model_validate(actualizado)


@router.put(
    "/{rol_id}/permisos",
    response_model=RolRead,
    summary="Establecer los permisos de un rol",
    dependencies=[Depends(require_permiso("roles:editar"))],
)
def establecer_permisos(
    rol_id: int, datos: RolPermisosUpdate, roles: RolRepo, permisos: PermisoRepo
) -> RolRead:
    actualizado = EstablecerPermisosRol(roles, permisos).ejecutar(
        rol_id, datos.permiso_ids
    )
    return RolRead.model_validate(actualizado)


@router.delete(
    "/{rol_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un rol (no de sistema y sin usuarios)",
    dependencies=[Depends(require_permiso("roles:eliminar"))],
)
def eliminar_rol(rol_id: int, roles: RolRepo) -> None:
    EliminarRol(roles).ejecutar(rol_id)
