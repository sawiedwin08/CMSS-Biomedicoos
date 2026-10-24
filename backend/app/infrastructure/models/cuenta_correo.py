"""Cuenta de correo (Gmail) con su contraseña cifrada — sección Cuentas de correo.

La contraseña NO se guarda en texto plano: se almacena cifrada (ver
`app.infrastructure.services.cifrado`) y solo se descifra para quien tenga el
permiso adecuado.
"""
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base
from app.infrastructure.models.mixins import TimestampMixin


class CuentaCorreo(Base, TimestampMixin):
    __tablename__ = "cuentas_correo"
    __table_args__ = {"schema": "sistemas"}

    id: Mapped[int] = mapped_column(primary_key=True)
    correo: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    contrasena_cifrada: Mapped[str] = mapped_column(String(500))
    asignado_a: Mapped[str | None] = mapped_column(String(150), index=True)
    area: Mapped[str | None] = mapped_column(String(150))
    recuperacion: Mapped[str | None] = mapped_column(String(150))
    proposito: Mapped[str | None] = mapped_column(String(200))
    estado: Mapped[str] = mapped_column(String(20), default="activa", server_default="activa")
    notas: Mapped[str | None] = mapped_column(Text)
