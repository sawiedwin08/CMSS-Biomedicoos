"""Router interno de la Mesa de ayuda (bandeja de tickets) — requiere login."""
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response

from app.domain.enums.mesa_ayuda import CategoriaTicket, EstadoTicket
from app.presentation.api.deps import CurrentUser, TicketRepo, UsuarioRepo, require_permiso
from app.presentation.api.v1.routers.soporte import guardar_adjunto
from app.presentation.schemas.ticket import (
    AdjuntoRead,
    ComentarioCreate,
    ComentarioRead,
    TicketListItem,
    TicketRead,
    TicketUpdate,
)

router = APIRouter(prefix="/sistemas/mesa-ayuda", tags=["Sistemas · Mesa de ayuda"])


@router.get(
    "/tickets/nuevos",
    summary="Cantidad de tickets nuevos (para el contador)",
    dependencies=[Depends(require_permiso("mesa_ayuda:ver"))],
)
def contar_nuevos(tickets: TicketRepo) -> dict:
    return {"count": tickets.contar_nuevos()}


@router.get(
    "/tickets",
    response_model=list[TicketListItem],
    summary="Bandeja de tickets",
    dependencies=[Depends(require_permiso("mesa_ayuda:ver"))],
)
def listar_tickets(
    tickets: TicketRepo,
    estado: Annotated[EstadoTicket | None, Query()] = None,
    categoria: Annotated[CategoriaTicket | None, Query()] = None,
    texto: Annotated[str | None, Query()] = None,
) -> list[TicketListItem]:
    out: list[TicketListItem] = []
    for t, tecnico in tickets.listar(
        estado=estado.value if estado else None,
        categoria=categoria.value if categoria else None,
        texto=texto,
    ):
        item = TicketListItem.model_validate(t)
        item.tecnico_nombre = tecnico
        out.append(item)
    return out


@router.get(
    "/tickets/{ticket_id}",
    response_model=TicketRead,
    summary="Ver un ticket",
    dependencies=[Depends(require_permiso("mesa_ayuda:ver"))],
)
def obtener_ticket(ticket_id: int, tickets: TicketRepo) -> TicketRead:
    t = tickets.obtener_por_id(ticket_id)
    if t is None:
        raise HTTPException(status_code=404, detail="El ticket no existe.")
    return TicketRead.model_validate(t)


@router.put(
    "/tickets/{ticket_id}",
    response_model=TicketRead,
    summary="Actualizar un ticket (estado, prioridad, categoría, técnico)",
    dependencies=[Depends(require_permiso("mesa_ayuda:editar"))],
)
def actualizar_ticket(
    ticket_id: int, datos: TicketUpdate, tickets: TicketRepo, usuarios: UsuarioRepo
) -> TicketRead:
    if tickets.obtener_por_id(ticket_id) is None:
        raise HTTPException(status_code=404, detail="El ticket no existe.")
    if datos.tecnico_id and usuarios.obtener_por_id(datos.tecnico_id) is None:
        raise HTTPException(status_code=400, detail="El técnico asignado no existe.")
    t = tickets.actualizar(
        ticket_id,
        {
            "estado": datos.estado.value,
            "prioridad": datos.prioridad.value,
            "categoria": datos.categoria.value,
            "tecnico_id": datos.tecnico_id,
        },
    )
    return TicketRead.model_validate(t)


@router.get(
    "/tickets/{ticket_id}/comentarios",
    response_model=list[ComentarioRead],
    summary="Comentarios de un ticket",
    dependencies=[Depends(require_permiso("mesa_ayuda:ver"))],
)
def listar_comentarios(ticket_id: int, tickets: TicketRepo) -> list[ComentarioRead]:
    return [ComentarioRead.model_validate(c) for c in tickets.listar_comentarios(ticket_id)]


@router.post(
    "/tickets/{ticket_id}/comentarios",
    response_model=ComentarioRead,
    status_code=status.HTTP_201_CREATED,
    summary="Agregar un comentario al ticket",
    dependencies=[Depends(require_permiso("mesa_ayuda:editar"))],
)
def agregar_comentario(
    ticket_id: int, datos: ComentarioCreate, tickets: TicketRepo, usuario: CurrentUser
) -> ComentarioRead:
    if tickets.obtener_por_id(ticket_id) is None:
        raise HTTPException(status_code=404, detail="El ticket no existe.")
    c = tickets.agregar_comentario(
        ticket_id,
        autor=usuario.nombre,
        texto_=datos.texto,
        es_publico=datos.es_publico,
        usuario_id=usuario.id,
    )
    return ComentarioRead.model_validate(c)


@router.get(
    "/tickets/{ticket_id}/adjuntos",
    response_model=list[AdjuntoRead],
    summary="Adjuntos de un ticket",
    dependencies=[Depends(require_permiso("mesa_ayuda:ver"))],
)
def listar_adjuntos(ticket_id: int, tickets: TicketRepo) -> list[AdjuntoRead]:
    if tickets.obtener_por_id(ticket_id) is None:
        raise HTTPException(status_code=404, detail="El ticket no existe.")
    return [AdjuntoRead.model_validate(a) for a in tickets.listar_adjuntos(ticket_id)]


@router.get(
    "/tickets/{ticket_id}/adjuntos/{adjunto_id}",
    summary="Descargar un adjunto",
    dependencies=[Depends(require_permiso("mesa_ayuda:ver"))],
)
def descargar_adjunto(ticket_id: int, adjunto_id: int, tickets: TicketRepo) -> Response:
    adj = tickets.obtener_adjunto(adjunto_id, ticket_id)
    if adj is None:
        raise HTTPException(status_code=404, detail="El adjunto no existe.")
    ruta = Path(adj.ruta_archivo)
    if not ruta.exists():
        raise HTTPException(status_code=404, detail="El archivo no está en el servidor.")
    with open(ruta, "rb") as f:
        contenido = f.read()
    return Response(
        content=contenido,
        media_type=adj.mime_type,
        headers={"Content-Disposition": f"attachment; filename={adj.nombre_archivo}"},
    )


@router.post(
    "/tickets/{ticket_id}/adjuntos",
    response_model=AdjuntoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Subir un adjunto al ticket (técnico)",
    dependencies=[Depends(require_permiso("mesa_ayuda:editar"))],
)
def subir_adjunto(
    ticket_id: int,
    tickets: TicketRepo,
    usuario: CurrentUser,
    archivo: Annotated[UploadFile, File()],
) -> AdjuntoRead:
    t = tickets.obtener_por_id(ticket_id)
    if t is None:
        raise HTTPException(status_code=404, detail="El ticket no existe.")
    adj = guardar_adjunto(tickets, t, archivo, origen="tecnico", usuario_id=usuario.id)
    return AdjuntoRead.model_validate(adj)
