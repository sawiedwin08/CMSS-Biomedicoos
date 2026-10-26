"""Router de notificaciones internas (módulo Sistemas). Cada usuario ve las suyas."""
from fastapi import APIRouter, status

from app.presentation.api.deps import CurrentUser, NotificacionRepo
from app.presentation.schemas.notificaciones import NotificacionRead

router = APIRouter(prefix="/sistemas/notificaciones", tags=["Sistemas · Notificaciones"])


@router.get("", response_model=list[NotificacionRead], summary="Mis notificaciones")
def listar_notificaciones(
    notificaciones: NotificacionRepo, usuario: CurrentUser
) -> list[NotificacionRead]:
    return [
        NotificacionRead.model_validate(n)
        for n in notificaciones.listar(usuario.id)
    ]


@router.get("/count", summary="Cantidad de notificaciones no leídas")
def contar_no_leidas(notificaciones: NotificacionRepo, usuario: CurrentUser) -> dict:
    return {"count": notificaciones.contar_no_leidas(usuario.id)}


@router.post(
    "/{notif_id}/leida",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Marcar una notificación como leída",
)
def marcar_leida(
    notif_id: int, notificaciones: NotificacionRepo, usuario: CurrentUser
) -> None:
    notificaciones.marcar_leida(notif_id, usuario.id)


@router.post(
    "/leidas",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Marcar todas mis notificaciones como leídas",
)
def marcar_todas(notificaciones: NotificacionRepo, usuario: CurrentUser) -> None:
    notificaciones.marcar_todas_leidas(usuario.id)
