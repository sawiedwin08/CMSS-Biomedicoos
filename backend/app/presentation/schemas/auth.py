"""Schemas Pydantic para autenticación (contrato HTTP / Swagger)."""
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
