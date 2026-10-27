"""Router interno de la Mesa de ayuda (bandeja de tickets) — requiere login."""
from datetime import date, datetime
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response

from app.domain.enums.mesa_ayuda import (
    ESTADOS_CERRADOS,
    CategoriaTicket,
    EstadoTicket,
    PrioridadTicket,
)
from app.presentation.api.deps import (
    CurrentUser,
    NotificacionRepo,
    TicketRepo,
    UsuarioRepo,
    require_permiso,
)
from app.presentation.api.v1.routers.soporte import guardar_adjunto
from app.infrastructure.services.excel_tickets import generar_reporte
from app.presentation.schemas.ticket import (
    AdjuntoRead,
    AsignarTicket,
    ComentarioCreate,
    ComentarioRead,
    TicketListItem,
    TicketRead,
    TicketUpdate,
)

router = APIRouter(prefix="/sistemas/mesa-ayuda", tags=["Sistemas · Mesa de ayuda"])

_ETIQUETA_ESTADO = {
    "nuevo": "Nuevo",
    "asignado": "Asignado",
    "en_proceso": "En proceso",
    "en_espera": "En espera",
    "resuelto": "Resuelto",
    "cerrado": "Cerrado",
    "reabierto": "Reabierto",
}


@router.get(
    "/tickets/nuevos",
    summary="Cantidad de tickets nuevos (para el contador)",
    dependencies=[Depends(require_permiso("mesa_ayuda:ver"))],
)
def contar_nuevos(tickets: TicketRepo) -> dict:
    return {"count": tickets.contar_nuevos()}


@router.get(
    "/tecnicos",
    summary="Usuarios asignables (quienes tienen acceso a la mesa de ayuda)",
    dependencies=[Depends(require_permiso("mesa_ayuda:ver"))],
)
def listar_tecnicos(usuarios: UsuarioRepo) -> list[dict]:
    # Solo gente de Sistemas: usuarios activos con acceso a la mesa de ayuda.
    return [
        {"id": u.id, "nombre": u.nombre}
        for u in usuarios.listar()
        if u.activo and "mesa_ayuda:ver" in u.permisos
    ]


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
    "/tickets/reporte",
    summary="Reporte Excel de tickets (métricas de tiempos y causas)",
    dependencies=[Depends(require_permiso("mesa_ayuda:ver"))],
)
def reporte_tickets(
    tickets: TicketRepo,
    desde: Annotated[date | None, Query()] = None,
    hasta: Annotated[date | None, Query()] = None,
    estado: Annotated[EstadoTicket | None, Query()] = None,
    categoria: Annotated[CategoriaTicket | None, Query()] = None,
    prioridad: Annotated[PrioridadTicket | None, Query()] = None,
    tecnico_id: Annotated[int | None, Query()] = None,
) -> Response:
    datos = tickets.listar_para_reporte(
        desde=desde,
        hasta=hasta,
        estado=estado.value if estado else None,
        categoria=categoria.value if categoria else None,
        prioridad=prioridad.value if prioridad else None,
        tecnico_id=tecnico_id,
    )
    historial = tickets.historial_estados([t.id for t, _, _ in datos])
    xlsx = generar_reporte(datos, historial)
    nombre = f"reporte_tickets_{date.today().isoformat()}.xlsx"
    return Response(
        content=xlsx,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={nombre}"},
    )


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
    ticket_id: int,
    datos: TicketUpdate,
    tickets: TicketRepo,
    usuario: CurrentUser,
    notificaciones: NotificacionRepo,
) -> TicketRead:
    actual = tickets.obtener_por_id(ticket_id)
    if actual is None:
        raise HTTPException(status_code=404, detail="El ticket no existe.")
    estado_anterior = actual.estado
    cambios: dict = {
        "estado": datos.estado.value,
        "prioridad": datos.prioridad.value,
        "categoria": datos.categoria.value,
        "causa": datos.causa.value if datos.causa else None,
        "solucion": datos.solucion,
    }
    # Marca de cierre: se fija al entrar a resuelto/cerrado y se limpia al reabrir.
    if datos.estado.value in ESTADOS_CERRADOS:
        if actual.fecha_cierre is None:
            cambios["fecha_cierre"] = datetime.now()
    elif actual.fecha_cierre is not None:
        cambios["fecha_cierre"] = None
    t = tickets.actualizar(ticket_id, cambios)
    # Novedad a los supervisores cuando cambia el estado (excepto al propio autor).
    if estado_anterior != t.estado:
        tickets.registrar_estado(t.id, t.estado)
        destinatarios = notificaciones.destinatarios_por_permiso(
            "mesa_ayuda:asignar", excluir_usuario_id=usuario.id
        )
        notificaciones.crear_para_usuarios(
            destinatarios,
            tipo="ticket_estado",
            titulo=f"Ticket {t.numero}: {_ETIQUETA_ESTADO.get(t.estado, t.estado)}",
            mensaje=f"{usuario.nombre} cambió el estado a "
            f"«{_ETIQUETA_ESTADO.get(t.estado, t.estado)}».",
            ticket_id=t.id,
            ticket_numero=t.numero,
        )
    return TicketRead.model_validate(t)


@router.put(
    "/tickets/{ticket_id}/asignar",
    response_model=TicketRead,
    summary="Asignar o reasignar el técnico del ticket",
    dependencies=[Depends(require_permiso("mesa_ayuda:asignar"))],
)
def asignar_ticket(
    ticket_id: int, datos: AsignarTicket, tickets: TicketRepo, usuarios: UsuarioRepo
) -> TicketRead:
    actual = tickets.obtener_por_id(ticket_id)
    if actual is None:
        raise HTTPException(status_code=404, detail="El ticket no existe.")
    if datos.tecnico_id and usuarios.obtener_por_id(datos.tecnico_id) is None:
        raise HTTPException(status_code=400, detail="El técnico asignado no existe.")
    cambios: dict = {"tecnico_id": datos.tecnico_id}
    # Al asignar un ticket aún nuevo, pasa automáticamente a "asignado".
    bump_asignado = bool(datos.tecnico_id) and actual.estado == "nuevo"
    if bump_asignado:
        cambios["estado"] = "asignado"
    t = tickets.actualizar(ticket_id, cambios)
    if bump_asignado:
        tickets.registrar_estado(t.id, "asignado")
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
    ticket_id: int,
    datos: ComentarioCreate,
    tickets: TicketRepo,
    usuario: CurrentUser,
    notificaciones: NotificacionRepo,
) -> ComentarioRead:
    ticket = tickets.obtener_por_id(ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="El ticket no existe.")
    c = tickets.agregar_comentario(
        ticket_id,
        autor=usuario.nombre,
        texto_=datos.texto,
        es_publico=datos.es_publico,
        usuario_id=usuario.id,
    )
    # Primer comentario del equipo = primera respuesta (para medir tiempos).
    tickets.marcar_primera_respuesta(ticket_id)
    # Novedad a los supervisores (excepto al propio autor del comentario).
    destinatarios = notificaciones.destinatarios_por_permiso(
        "mesa_ayuda:asignar", excluir_usuario_id=usuario.id
    )
    resumen = datos.texto if len(datos.texto) <= 80 else datos.texto[:80] + "…"
    notificaciones.crear_para_usuarios(
        destinatarios,
        tipo="ticket_comentario",
        titulo=f"Comentario en {ticket.numero}",
        mensaje=f"{usuario.nombre}: {resumen}",
        ticket_id=ticket.id,
        ticket_numero=ticket.numero,
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
