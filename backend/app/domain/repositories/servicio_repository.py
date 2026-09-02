"""Puerto del repositorio de servicios (RF-004)."""
from typing import Protocol

from app.domain.entities.servicio import Servicio


class ServicioRepository(Protocol):
    def listar(self) -> list[Servicio]: ...

    def obtener_por_id(self, servicio_id: int) -> Servicio | None: ...

    def existe_nombre(
        self, nombre: str, sede_id: int, excluir_id: int | None = None
    ) -> bool: ...

    def crear(self, servicio: Servicio) -> Servicio: ...

    def actualizar(
        self, servicio_id: int, nombre: str, sede_id: int, activo: bool
    ) -> Servicio: ...

    def eliminar(self, servicio_id: int) -> None: ...

    def contar_equipos(self, servicio_id: int) -> int: ...
