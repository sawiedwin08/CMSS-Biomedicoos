"""Router del catálogo de permisos (RF-029)."""
from fastapi import APIRouter, Depends

from app.application.use_cases.permisos.listar_permisos import ListarPermisos
from app.presentation.api.deps import PermisoRepo, require_permiso
from app.presentation.schemas.permisos import PermisoRead

router = APIRouter(prefix="/permisos", tags=["Roles y permisos"])


@router.get(
    "",
    response_model=list[PermisoRead],
    summary="Listar el catálogo de permisos",
    dependencies=[Depends(require_permiso("roles:ver"))],
)
def listar_permisos(permisos: PermisoRepo) -> list[PermisoRead]:
    return [PermisoRead.model_validate(p) for p in ListarPermisos(permisos).ejecutar()]
