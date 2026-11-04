"""Router del tablero de Inicio del módulo Sistemas (resumen)."""
from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.presentation.api.deps import ResumenRepo, require_permiso
from app.presentation.schemas.resumen import ResumenRead

router = APIRouter(prefix="/sistemas", tags=["Sistemas · Inicio"])


@router.get(
    "/resumen",
    response_model=ResumenRead,
    summary="Resumen para el tablero de Inicio",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def resumen(
    resumenes: ResumenRepo,
    desde: Annotated[date | None, Query()] = None,
    hasta: Annotated[date | None, Query()] = None,
) -> ResumenRead:
    # Por defecto: últimos 30 días.
    hasta_ef = hasta or date.today()
    desde_ef = desde or (hasta_ef - timedelta(days=29))
    return ResumenRead.model_validate(resumenes.resumen(desde_ef, hasta_ef))
