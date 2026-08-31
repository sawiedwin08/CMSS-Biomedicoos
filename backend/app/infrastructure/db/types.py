"""Utilidades de tipos para SQLAlchemy compartidas por los modelos."""
from enum import Enum

from sqlalchemy import Enum as SAEnum


def pg_enum(enum_cls: type[Enum], name: str) -> SAEnum:
    """Tipo ENUM de PostgreSQL cuyas etiquetas son los *valores* del StrEnum
    (p. ej. 'operativo') en lugar de los nombres de miembro ('OPERATIVO')."""
    return SAEnum(
        enum_cls,
        name=name,
        values_callable=lambda e: [member.value for member in e],
    )
