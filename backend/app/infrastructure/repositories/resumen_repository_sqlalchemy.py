"""Resumen/estadísticas para el tablero de Inicio del módulo Sistemas."""
from datetime import date, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain.enums.mesa_ayuda import EstadoTicket, PrioridadTicket
from app.infrastructure.models.activo import Activo
from app.infrastructure.models.ticket import Ticket


class ResumenRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def resumen(self, desde: date, hasta: date) -> dict:
        s = self._session

        # --- Inventario de equipos (por estado) ---
        act = dict(
            s.execute(
                select(Activo.estado, func.count(Activo.id)).group_by(Activo.estado)
            ).all()
        )
        total_activos = sum(act.values())

        # --- Soporte: backlog actual (no depende del período) ---
        tickets_abiertos = (
            s.scalar(select(func.count(Ticket.id)).where(Ticket.estado != "cerrado")) or 0
        )

        # --- Período: tickets creados en [desde, hasta] (inclusive) ---
        ini = datetime.combine(desde, time.min)
        fin = datetime.combine(hasta + timedelta(days=1), time.min)
        en_periodo = (Ticket.created_at >= ini) & (Ticket.created_at < fin)

        recibidos = s.scalar(select(func.count(Ticket.id)).where(en_periodo)) or 0

        por_dia = [
            {"fecha": str(d), "cantidad": int(c)}
            for d, c in s.execute(
                select(func.date(Ticket.created_at), func.count(Ticket.id))
                .where(en_periodo)
                .group_by(func.date(Ticket.created_at))
                .order_by(func.date(Ticket.created_at))
            ).all()
        ]

        est = dict(
            s.execute(
                select(Ticket.estado, func.count(Ticket.id))
                .where(en_periodo)
                .group_by(Ticket.estado)
            ).all()
        )
        por_estado = [
            {"estado": e.value, "cantidad": int(est[e.value])}
            for e in EstadoTicket
            if est.get(e.value)
        ]

        pri = dict(
            s.execute(
                select(Ticket.prioridad, func.count(Ticket.id))
                .where(en_periodo)
                .group_by(Ticket.prioridad)
            ).all()
        )
        por_prioridad = [
            {"prioridad": p.value, "cantidad": int(pri[p.value])}
            for p in PrioridadTicket
            if pri.get(p.value)
        ]

        por_area = [
            {"area": a or "Sin área", "cantidad": int(c)}
            for a, c in s.execute(
                select(Ticket.area, func.count(Ticket.id))
                .where(en_periodo)
                .group_by(Ticket.area)
                .order_by(func.count(Ticket.id).desc())
                .limit(8)
            ).all()
        ]

        return {
            "activos_total": int(total_activos),
            "activos_operativo": int(act.get("operativo", 0)),
            "activos_en_reparacion": int(act.get("en_reparacion", 0)),
            "activos_en_bodega": int(act.get("en_bodega", 0)),
            "activos_baja": int(act.get("baja", 0)),
            "tickets_abiertos": int(tickets_abiertos),
            "tickets_recibidos_periodo": int(recibidos),
            "periodo_desde": desde.isoformat(),
            "periodo_hasta": hasta.isoformat(),
            "tickets_por_dia": por_dia,
            "tickets_por_estado": por_estado,
            "tickets_por_prioridad": por_prioridad,
            "tickets_por_area": por_area,
        }
