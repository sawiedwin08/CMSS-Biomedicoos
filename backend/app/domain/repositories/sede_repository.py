"""Puerto del repositorio de sedes (RF-004)."""
from typing import Protocol

from app.domain.entities.sede import Sede


class SedeRepository(Protocol):
    def listar(self) -> list[Sede]: ...

    def obtener_por_id(self, sede_id: int) -> Sede | None: ...

    def existe_nombre(self, nombre: str, excluir_id: int | None = None) -> bool: ...

    def crear(self, sede: Sede) -> Sede: ...

    def actualizar(
        self,
        sede_id: int,
        nombre: str,
        direccion: str | None,
        ciudad: str | None,
        activo: bool,
    ) -> Sede: ...

    def eliminar(self, sede_id: int) -> None: ...

    def contar_servicios(self, sede_id: int) -> int: ...

    def contar_equipos(self, sede_id: int) -> int: ...
