"""Caso de uso: listar el catálogo de permisos (RF-029)."""
from app.domain.entities.permiso import Permiso
from app.domain.repositories.permiso_repository import PermisoRepository


class ListarPermisos:
    def __init__(self, permisos: PermisoRepository) -> None:
        self._permisos = permisos

    def ejecutar(self) -> list[Permiso]:
        return self._permisos.listar()
