"""Cifrado reversible para secretos (contraseñas de cuentas de correo).

Usa Fernet (cryptography) con una llave derivada de SECRET_KEY. Permite
descifrar para mostrar la contraseña a quien tenga permiso. Si SECRET_KEY
cambia, los valores ya cifrados dejan de poder descifrarse.
"""
import base64
import hashlib
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


@lru_cache
def _fernet() -> Fernet:
    clave = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())
    return Fernet(clave)


def cifrar(texto: str) -> str:
    return _fernet().encrypt((texto or "").encode()).decode()


def descifrar(token: str) -> str:
    if not token:
        return ""
    try:
        return _fernet().decrypt(token.encode()).decode()
    except (InvalidToken, ValueError):
        return ""
