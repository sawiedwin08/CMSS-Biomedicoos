"""Router PÚBLICO de la Mesa de ayuda (sin login): crear ticket, adjuntar, consultar."""
import os
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.core.config import settings
from app.presentation.api.deps import NotificacionRepo, ServicioRepo, TicketRepo
from app.presentation.schemas.ticket import (
    AdjuntoRead,
    ComentarioPublicoRead,
    SeguimientoConsulta,
    TicketCreado,
    TicketPublicoCreate,
    TicketPublicoRead,
)

router = APIRouter(prefix="/soporte", tags=["Mesa de ayuda · Público"])


@router.get("/areas", summary="Áreas/servicios para el formulario (público)")
def listar_areas(servicios: ServicioRepo) -> list[str]:
    return sorted({s.nombre for s in servicios.listar()})

_TICKETS_DIR = Path(settings.STORAGE_DIR) / "sistemas" / "tickets"
_ADJ_MAX_BYTES = 10 * 1024 * 1024


def guardar_adjunto(tickets, ticket, archivo, origen: str, usuario_id: int | None):
    """Guarda el archivo en disco y crea el registro del adjunto."""
    contenido = archivo.file.read()
    if len(contenido) > _ADJ_MAX_BYTES:
        raise HTTPException(status_code=400, detail="El archivo supera el máximo de 10 MB.")
    directorio = _TICKETS_DIR / ticket.numero
    directorio.mkdir(parents=True, exist_ok=True)
    nombre = archivo.filename or "adjunto"
    ruta = directorio / nombre
    if ruta.exists():
        base, ext = os.path.splitext(nombre)
        n = 1
        while ruta.exists():
            nombre = f"{base}_{n}{ext}"
            ruta = directorio / nombre
            n += 1
    with open(ruta, "wb") as f:
        f.write(contenido)
    return tickets.crear_adjunto(
        ticket.id,
        nombre_archivo=nombre,
        ruta_archivo=str(ruta),
        mime_type=archivo.content_type or "application/octet-stream",
        tamano_bytes=len(contenido),
        origen=origen,
        usuario_id=usuario_id,
    )


@router.post(
    "/tickets",
    response_model=TicketCreado,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un ticket de soporte (público, sin login)",
)
def crear_ticket(
    datos: TicketPublicoCreate, tickets: TicketRepo, notificaciones: NotificacionRepo
) -> TicketCreado:
    d = datos.model_dump()
    d["categoria"] = datos.categoria.value
    ticket = tickets.crear(d)
    tickets.registrar_estado(ticket.id, "nuevo")
    # Avisa a los supervisores (quienes pueden asignar) del ticket nuevo.
    destinatarios = notificaciones.destinatarios_por_permiso("mesa_ayuda:asignar")
    notificaciones.crear_para_usuarios(
        destinatarios,
        tipo="ticket_nuevo",
        titulo=f"Nuevo ticket {ticket.numero}",
        mensaje=f"{ticket.solicitante_nombre}: {ticket.asunto}",
        ticket_id=ticket.id,
        ticket_numero=ticket.numero,
    )
    return TicketCreado(numero=ticket.numero)


@router.post(
    "/adjuntos",
    response_model=AdjuntoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Adjuntar un archivo a un ticket (público, con número + correo)",
)
def adjuntar_publico(
    tickets: TicketRepo,
    numero: Annotated[str, Form()],
    correo: Annotated[str, Form()],
    archivo: Annotated[UploadFile, File()],
) -> AdjuntoRead:
    ticket = tickets.obtener_por_numero_correo(numero, correo)
    if ticket is None:
        raise HTTPException(status_code=404, detail="No existe un ticket con ese número y correo.")
    adj = guardar_adjunto(tickets, ticket, archivo, origen="solicitante", usuario_id=None)
    return AdjuntoRead.model_validate(adj)


@router.post(
    "/seguimiento",
    response_model=TicketPublicoRead,
    summary="Consultar el estado de un ticket (número + correo)",
)
def seguimiento(consulta: SeguimientoConsulta, tickets: TicketRepo) -> TicketPublicoRead:
    # Si llega correo se valida; por ahora la consulta pública usa solo el número.
    if consulta.correo:
        ticket = tickets.obtener_por_numero_correo(consulta.numero, consulta.correo)
    else:
        ticket = tickets.obtener_por_numero(consulta.numero)
    if ticket is None:
        raise HTTPException(
            status_code=404,
            detail="No se encontró un ticket con ese número.",
        )
    comentarios = tickets.listar_comentarios(ticket.id, solo_publicos=True)
    adjuntos = tickets.listar_adjuntos(ticket.id)
    return TicketPublicoRead(
        numero=ticket.numero,
        asunto=ticket.asunto,
        categoria=ticket.categoria,
        estado=ticket.estado,
        created_at=ticket.created_at,
        comentarios=[ComentarioPublicoRead.model_validate(c) for c in comentarios],
        adjuntos=[AdjuntoRead.model_validate(a) for a in adjuntos],
    )
