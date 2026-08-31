"""Rol del sistema (RF-028). Los roles son datos gestionables (RBAC dinámico)."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base
from app.infrastructure.models.associations import rol_permiso
from app.infrastructure.models.mixins import TimestampMixin
from app.infrastructure.models.permiso import PermisoModel


class RolModel(Base, TimestampMixin):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    descripcion: Mapped[str | None] = mapped_column(String(200))
    # Los roles 'de sistema' no se pueden eliminar (protege los roles base).
    es_sistema: Mapped[bool] = mapped_column(default=False)

    permisos: Mapped[list[PermisoModel]] = relationship(
        secondary=rol_permiso,
        lazy="selectin",
        order_by="PermisoModel.codigo",
    )
