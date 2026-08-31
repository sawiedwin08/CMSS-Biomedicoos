"""Puertos de seguridad usados por los casos de uso.

Las implementaciones concretas (bcrypt, JWT) están en Infrastructure.
"""
from typing import Protocol


class PasswordHasher(Protocol):
    def hash(self, plano: str) -> str: ...

    def verify(self, plano: str, hashed: str) -> bool: ...


class TokenService(Protocol):
    def crear_token_acceso(self, subject: str, rol: str) -> str: ...

    def decodificar(self, token: str) -> dict: ...
