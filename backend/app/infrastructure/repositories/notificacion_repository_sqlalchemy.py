"""Repositorio SQLAlchemy de notificaciones internas (módulo Sistemas)."""
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.infrastructure.models.notificacion import Notificacion
from app.infrastructure.models.permiso import PermisoModel
from app.infrastructure.models.rol import RolModel
from app.infrastructure.models.usuario import UsuarioModel


class NotificacionRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def destinatarios_por_permiso(
        self, codigo: str, excluir_usuario_id: int | None = None
    ) -> list[int]:
        """IDs de usuarios activos cuyo rol tiene el permiso dado (supervisores)."""
        stmt = (
            select(UsuarioModel.id)
            .join(RolModel, UsuarioModel.rol_id == RolModel.id)
            .join(RolModel.permisos)
            .where(PermisoModel.codigo == codigo, UsuarioModel.activo.is_(True))
            .distinct()
        )
        if excluir_usuario_id is not None:
            stmt = stmt.where(UsuarioModel.id != excluir_usuario_id)
        return list(self._session.scalars(stmt))

    def crear_para_usuarios(
        self,
        usuario_ids: list[int],
        tipo: str,
        titulo: str,
        mensaje: str,
        ticket_id: int | None = None,
        ticket_numero: str | None = None,
    ) -> int:
        if not usuario_ids:
            return 0
        objs = [
            Notificacion(
                usuario_id=uid,
                tipo=tipo,
                titulo=titulo,
                mensaje=mensaje,
                ticket_id=ticket_id,
                ticket_numero=ticket_numero,
            )
            for uid in usuario_ids
        ]
        self._session.add_all(objs)
        self._session.commit()
        return len(objs)

    def listar(self, usuario_id: int, limite: int = 50) -> list[Notificacion]:
        stmt = (
            select(Notificacion)
            .where(Notificacion.usuario_id == usuario_id)
            .order_by(Notificacion.created_at.desc())
            .limit(limite)
        )
        return list(self._session.scalars(stmt))

    def contar_no_leidas(self, usuario_id: int) -> int:
        total = self._session.scalar(
            select(func.count(Notificacion.id)).where(
                Notificacion.usuario_id == usuario_id, Notificacion.leido.is_(False)
            )
        )
        return int(total or 0)

    def marcar_leida(self, notif_id: int, usuario_id: int) -> None:
        n = self._session.scalar(
            select(Notificacion).where(
                Notificacion.id == notif_id, Notificacion.usuario_id == usuario_id
            )
        )
        if n is not None and not n.leido:
            n.leido = True
            self._session.commit()

    def marcar_todas_leidas(self, usuario_id: int) -> int:
        res = self._session.execute(
            update(Notificacion)
            .where(Notificacion.usuario_id == usuario_id, Notificacion.leido.is_(False))
            .values(leido=True)
        )
        self._session.commit()
        return int(res.rowcount or 0)
