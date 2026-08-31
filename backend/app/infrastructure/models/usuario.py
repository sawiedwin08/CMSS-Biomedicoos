"""Modelo de persistencia de usuarios (RF-028)."""
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin
from app.infrastructure.models.rol import RolModel


class UsuarioModel(Base, TimestampMixin):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    rol_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), index=True)
    activo: Mapped[bool] = mapped_column(default=True)
    # Un usuario protegido solo puede ser editado por sí mismo (RF-030).
    es_protegido: Mapped[bool] = mapped_column(default=False)

    # Carga el rol (y sus permisos) junto con el usuario.
    rol: Mapped[RolModel] = relationship(lazy="joined")
