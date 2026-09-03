"""Router de módulos de la plataforma y su acceso por rol."""
from fastapi import APIRouter, Depends, status

from app.presentation.api.deps import CurrentUser, ModuloRepo, require_permiso
from app.presentation.schemas.modulos import ModuloRead, RolModulosUpdate

router = APIRouter(tags=["Módulos"])


@router.get(
    "/mis-modulos",
    response_model=list[ModuloRead],
    summary="Módulos a los que el usuario tiene acceso",
)
def mis_modulos(usuario: CurrentUser, modulos: ModuloRepo) -> list[ModuloRead]:
    accesibles = modulos.listar_de_rol(usuario.rol_id, solo_activos=True)
    return [ModuloRead.model_validate(m) for m in accesibles]


@router.get(
    "/modulos",
    response_model=list[ModuloRead],
    summary="Listar todos los módulos (administración)",
    dependencies=[Depends(require_permiso("modulos:ver"))],
)
def listar_modulos(modulos: ModuloRepo) -> list[ModuloRead]:
    return [ModuloRead.model_validate(m) for m in modulos.listar()]


@router.get(
    "/roles/{rol_id}/modulos",
    response_model=list[ModuloRead],
    summary="Módulos a los que accede un rol",
    dependencies=[Depends(require_permiso("modulos:ver"))],
)
def modulos_de_rol(rol_id: int, modulos: ModuloRepo) -> list[ModuloRead]:
    asignados = modulos.listar_de_rol(rol_id, solo_activos=False)
    return [ModuloRead.model_validate(m) for m in asignados]


@router.put(
    "/roles/{rol_id}/modulos",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Establecer los módulos a los que accede un rol",
    dependencies=[Depends(require_permiso("modulos:asignar"))],
)
def establecer_modulos_rol(
    rol_id: int, datos: RolModulosUpdate, modulos: ModuloRepo
) -> None:
    modulos.establecer_modulos_de_rol(rol_id, datos.modulo_ids)
