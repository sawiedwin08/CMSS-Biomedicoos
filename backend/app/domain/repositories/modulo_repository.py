"""Puerto del repositorio de módulos de la plataforma."""
from typing import Protocol

from app.domain.entities.modulo import Modulo


class ModuloRepository(Protocol):
    def listar(self) -> list[Modulo]: ...

    def listar_de_rol(self, rol_id: int, solo_activos: bool = True) -> list[Modulo]: ...

    def establecer_modulos_de_rol(self, rol_id: int, modulo_ids: list[int]) -> None: ...
