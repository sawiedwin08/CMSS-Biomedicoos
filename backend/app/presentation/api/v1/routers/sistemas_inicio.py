"""Router del tablero de Inicio del módulo Sistemas (resumen)."""
from fastapi import APIRouter, Depends

from app.presentation.api.deps import ResumenRepo, require_permiso
from app.presentation.schemas.resumen import ResumenRead

router = APIRouter(prefix="/sistemas", tags=["Sistemas · Inicio"])


@router.get(
    "/resumen",
    response_model=ResumenRead,
    summary="Resumen para el tablero de Inicio",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def resumen(resumenes: ResumenRepo) -> ResumenRead:
    return ResumenRead.model_validate(resumenes.resumen())
