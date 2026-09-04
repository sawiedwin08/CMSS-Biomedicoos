"""Puerto (interfaz) del repositorio de usuarios.

Definido en el dominio; la implementación concreta vive en Infrastructure
(inversión de dependencias — D de SOLID).
"""
from typing import Protocol

from app.domain.entities.usuario import Usuario


class UsuarioRepository(Protocol):
    def obtener_por_id(self, usuario_id: int) -> Usuario | None: ...

    def obtener_por_email(self, email: str) -> Usuario | None: ...

    def existe_email(self, email: str) -> bool: ...

    def crear(self, usuario: Usuario) -> Usuario: ...

    def asignar_rol(self, usuario_id: int, rol_id: int) -> Usuario: ...

    def actualizar(
        self,
        usuario_id: int,
        nombre: str,
        email: str,
        rol_id: int,
        activo: bool,
        es_protegido: bool,
    ) -> Usuario: ...

    def actualizar_password(self, usuario_id: int, hashed_password: str) -> None: ...

    def listar(self) -> list[Usuario]: ...
