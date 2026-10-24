"""Resumen/estadísticas para el tablero de Inicio del módulo Sistemas."""
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.domain.enums.mesa_ayuda import EstadoTicket
from app.infrastructure.models.activo import Activo
from app.infrastructure.models.cuenta_correo import CuentaCorreo
from app.infrastructure.models.ticket import Ticket


class ResumenRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def resumen(self) -> dict:
        s = self._session

        act = dict(
            s.execute(
                select(Activo.estado, func.count(Activo.id)).group_by(Activo.estado)
            ).all()
        )
        total_activos = sum(act.values())

        tickets_abiertos = (
            s.scalar(select(func.count(Ticket.id)).where(Ticket.estado != "cerrado")) or 0
        )
        tickets_nuevos_hoy = (
            s.scalar(
                select(func.count(Ticket.id)).where(func.date(Ticket.created_at) == date.today())
            )
            or 0
        )
        cuentas = (
            s.scalar(select(func.count(CuentaCorreo.id)).where(CuentaCorreo.estado == "activa"))
            or 0
        )

        tk = dict(
            s.execute(
                select(Ticket.estado, func.count(Ticket.id)).group_by(Ticket.estado)
            ).all()
        )
        por_estado = [
            {"estado": e.value, "cantidad": int(tk.get(e.value, 0))} for e in EstadoTicket
        ]

        return {
            "activos_total": int(total_activos),
            "activos_operativo": int(act.get("operativo", 0)),
            "activos_en_reparacion": int(act.get("en_reparacion", 0)),
            "activos_en_bodega": int(act.get("en_bodega", 0)),
            "activos_baja": int(act.get("baja", 0)),
            "tickets_abiertos": int(tickets_abiertos),
            "tickets_nuevos_hoy": int(tickets_nuevos_hoy),
            "cuentas_activas": int(cuentas),
            "tickets_por_estado": por_estado,
        }
