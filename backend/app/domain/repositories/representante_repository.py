"""Puerto del repositorio de representantes (maestro de equipos biomédicos)."""
from typing import Protocol

from app.domain.entities.representante import Representante


class RepresentanteRepository(Protocol):
    def listar(self) -> list[Representante]: ...

    def obtener_por_id(self, representante_id: int) -> Representante | None: ...

    def existe_nombre(self, nombre: str, excluir_id: int | None = None) -> bool: ...

    def crear(self, representante: Representante) -> Representante: ...

    def actualizar(
        self, representante_id: int, datos: Representante
    ) -> Representante: ...

    def eliminar(self, representante_id: int) -> None: ...
