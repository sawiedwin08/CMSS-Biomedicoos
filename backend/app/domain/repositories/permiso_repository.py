"""Puerto del repositorio de permisos (catálogo, RF-029)."""
from typing import Protocol

from app.domain.entities.permiso import Permiso


class PermisoRepository(Protocol):
    def listar(self) -> list[Permiso]: ...

    def existen_ids(self, permiso_ids: list[int]) -> bool: ...
