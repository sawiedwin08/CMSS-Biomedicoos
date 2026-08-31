"""Implementaciones concretas de los puertos de seguridad (bcrypt + JWT)."""
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings
from app.domain.exceptions import CredencialesInvalidas

# bcrypt solo considera los primeros 72 bytes de la contraseña.
_BCRYPT_MAX_BYTES = 72


class BcryptPasswordHasher:
    @staticmethod
    def _encode(plano: str) -> bytes:
        return plano.encode("utf-8")[:_BCRYPT_MAX_BYTES]

    def hash(self, plano: str) -> str:
        return bcrypt.hashpw(self._encode(plano), bcrypt.gensalt()).decode("utf-8")

    def verify(self, plano: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(self._encode(plano), hashed.encode("utf-8"))
        except ValueError:
            return False


class JwtTokenService:
    def crear_token_acceso(self, subject: str, rol: str) -> str:
        expira = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        payload: dict[str, Any] = {"sub": subject, "rol": rol, "exp": expira}
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def decodificar(self, token: str) -> dict:
        try:
            return jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
        except JWTError as exc:
            raise CredencialesInvalidas("Token inválido o expirado.") from exc
