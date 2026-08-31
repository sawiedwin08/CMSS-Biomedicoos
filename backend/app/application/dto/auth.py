"""DTOs de autenticación."""
from dataclasses import dataclass


@dataclass
class Credenciales:
    email: str
    password: str


@dataclass
class TokenData:
    access_token: str
    token_type: str = "bearer"
