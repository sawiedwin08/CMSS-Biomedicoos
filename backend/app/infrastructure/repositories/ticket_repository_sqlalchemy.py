"""Repositorio SQLAlchemy de la Mesa de ayuda (tickets + comentarios)."""
from datetime import date, datetime, timedelta

from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session

from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.ticket import Ticket
from app.infrastructure.models.ticket_adjunto import TicketAdjunto
from app.infrastructure.models.ticket_comentario import TicketComentario
from app.infrastructure.models.ticket_estado_historial import TicketEstadoHistorial
from app.infrastructure.models.usuario import UsuarioModel


class TicketRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def siguiente_numero(self) -> str:
        for _ in range(1000):
            n = self._session.execute(
                text("SELECT nextval('sistemas.ticket_numero_seq')")
            ).scalar_one()
            numero = f"MA-{n:04d}"
            existe = self._session.scalar(select(Ticket.id).where(Ticket.numero == numero))
            if existe is None:
                return numero
        raise RuntimeError("No se pudo generar el número de ticket.")

    def crear(self, datos: dict) -> Ticket:
        ticket = Ticket(numero=self.siguiente_numero(), estado="nuevo", **datos)
        self._session.add(ticket)
        self._session.commit()
        self._session.refresh(ticket)
        return ticket

    def listar(self, estado=None, categoria=None, tecnico_id=None, texto=None):
        stmt = (
            select(Ticket, UsuarioModel.nombre)
            .join(UsuarioModel, Ticket.tecnico_id == UsuarioModel.id, isouter=True)
        )
        if estado:
            stmt = stmt.where(Ticket.estado == estado)
        if categoria:
            stmt = stmt.where(Ticket.categoria == categoria)
        if tecnico_id:
            stmt = stmt.where(Ticket.tecnico_id == tecnico_id)
        if texto:
            p = f"%{texto.strip()}%"
            stmt = stmt.where(
                or_(
                    Ticket.numero.ilike(p),
                    Ticket.asunto.ilike(p),
                    Ticket.solicitante_nombre.ilike(p),
                    Ticket.solicitante_correo.ilike(p),
                )
            )
        stmt = stmt.order_by(Ticket.created_at.desc())
        return [(row[0], row[1]) for row in self._session.execute(stmt).all()]

    def obtener_por_id(self, ticket_id: int) -> Ticket | None:
        return self._session.get(Ticket, ticket_id)

    def obtener_por_numero(self, numero: str) -> Ticket | None:
        return self._session.scalar(
            select(Ticket).where(
                func.lower(Ticket.numero) == numero.strip().lower()
            )
        )

    def obtener_por_numero_correo(self, numero: str, correo: str) -> Ticket | None:
        return self._session.scalar(
            select(Ticket).where(
                func.lower(Ticket.numero) == numero.strip().lower(),
                func.lower(Ticket.solicitante_correo) == correo.strip().lower(),
            )
        )

    def actualizar(self, ticket_id: int, datos: dict) -> Ticket:
        ticket = self._session.get(Ticket, ticket_id)
        if ticket is None:
            raise RecursoNoEncontrado(f"El ticket {ticket_id} no existe.")
        for campo, valor in datos.items():
            setattr(ticket, campo, valor)
        self._session.commit()
        self._session.refresh(ticket)
        return ticket

    def marcar_primera_respuesta(self, ticket_id: int) -> None:
        """Fija la fecha de primera respuesta si aún no existe (idempotente)."""
        ticket = self._session.get(Ticket, ticket_id)
        if ticket is not None and ticket.fecha_primera_respuesta is None:
            ticket.fecha_primera_respuesta = datetime.now()
            self._session.commit()

    def listar_para_reporte(
        self,
        desde: date | None = None,
        hasta: date | None = None,
        estado: str | None = None,
        categoria: str | None = None,
        prioridad: str | None = None,
        tecnico_id: int | None = None,
    ) -> list[tuple[Ticket, str | None, int]]:
        """Tickets + nombre del técnico + nº de comentarios, para el reporte."""
        n_com = (
            select(func.count(TicketComentario.id))
            .where(TicketComentario.ticket_id == Ticket.id)
            .scalar_subquery()
        )
        stmt = select(Ticket, UsuarioModel.nombre, n_com).join(
            UsuarioModel, Ticket.tecnico_id == UsuarioModel.id, isouter=True
        )
        if desde:
            stmt = stmt.where(Ticket.created_at >= datetime.combine(desde, datetime.min.time()))
        if hasta:
            # Incluye todo el día "hasta".
            stmt = stmt.where(
                Ticket.created_at < datetime.combine(hasta + timedelta(days=1), datetime.min.time())
            )
        if estado:
            stmt = stmt.where(Ticket.estado == estado)
        if categoria:
            stmt = stmt.where(Ticket.categoria == categoria)
        if prioridad:
            stmt = stmt.where(Ticket.prioridad == prioridad)
        if tecnico_id:
            stmt = stmt.where(Ticket.tecnico_id == tecnico_id)
        stmt = stmt.order_by(Ticket.created_at)
        return [(r[0], r[1], int(r[2] or 0)) for r in self._session.execute(stmt).all()]

    # --- Historial de estados ---
    def registrar_estado(self, ticket_id: int, estado: str) -> None:
        self._session.add(
            TicketEstadoHistorial(
                ticket_id=ticket_id, estado=estado, fecha=datetime.now()
            )
        )
        self._session.commit()

    def historial_estados(
        self, ticket_ids: list[int]
    ) -> dict[int, list[tuple[str, datetime]]]:
        """Devuelve {ticket_id: [(estado, fecha), ...]} ordenado por fecha."""
        if not ticket_ids:
            return {}
        stmt = (
            select(
                TicketEstadoHistorial.ticket_id,
                TicketEstadoHistorial.estado,
                TicketEstadoHistorial.fecha,
            )
            .where(TicketEstadoHistorial.ticket_id.in_(ticket_ids))
            .order_by(TicketEstadoHistorial.ticket_id, TicketEstadoHistorial.fecha)
        )
        salida: dict[int, list[tuple[str, datetime]]] = {}
        for tid, estado, fecha in self._session.execute(stmt).all():
            salida.setdefault(tid, []).append((estado, fecha))
        return salida

    def contar_nuevos(self) -> int:
        total = self._session.scalar(
            select(func.count(Ticket.id)).where(Ticket.estado == "nuevo")
        )
        return int(total or 0)

    # --- Comentarios ---
    def agregar_comentario(
        self, ticket_id: int, autor: str, texto_: str, es_publico: bool, usuario_id: int | None
    ) -> TicketComentario:
        c = TicketComentario(
            ticket_id=ticket_id,
            autor=autor,
            texto=texto_,
            es_publico=es_publico,
            usuario_id=usuario_id,
        )
        self._session.add(c)
        self._session.commit()
        self._session.refresh(c)
        return c

    def listar_comentarios(self, ticket_id: int, solo_publicos: bool = False):
        stmt = select(TicketComentario).where(TicketComentario.ticket_id == ticket_id)
        if solo_publicos:
            stmt = stmt.where(TicketComentario.es_publico.is_(True))
        stmt = stmt.order_by(TicketComentario.created_at)
        return list(self._session.scalars(stmt))

    # --- Adjuntos ---
    def crear_adjunto(
        self,
        ticket_id: int,
        nombre_archivo: str,
        ruta_archivo: str,
        mime_type: str,
        tamano_bytes: int,
        origen: str,
        usuario_id: int | None,
    ) -> TicketAdjunto:
        adj = TicketAdjunto(
            ticket_id=ticket_id,
            nombre_archivo=nombre_archivo,
            ruta_archivo=ruta_archivo,
            mime_type=mime_type,
            tamano_bytes=tamano_bytes,
            origen=origen,
            usuario_id=usuario_id,
        )
        self._session.add(adj)
        self._session.commit()
        self._session.refresh(adj)
        return adj

    def listar_adjuntos(self, ticket_id: int):
        return list(
            self._session.scalars(
                select(TicketAdjunto)
                .where(TicketAdjunto.ticket_id == ticket_id)
                .order_by(TicketAdjunto.created_at)
            )
        )

    def obtener_adjunto(self, adjunto_id: int, ticket_id: int) -> TicketAdjunto | None:
        return self._session.scalar(
            select(TicketAdjunto).where(
                TicketAdjunto.id == adjunto_id, TicketAdjunto.ticket_id == ticket_id
            )
        )
