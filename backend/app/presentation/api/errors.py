"""Mapeo de excepciones de dominio a respuestas HTTP."""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.domain.exceptions import (
    CredencialesInvalidas,
    DomainError,
    EmailYaRegistrado,
    NoAutorizado,
    NombreDuplicado,
    OperacionNoPermitida,
    RecursoNoEncontrado,
)

_STATUS_POR_EXCEPCION: dict[type[DomainError], int] = {
    CredencialesInvalidas: status.HTTP_401_UNAUTHORIZED,
    EmailYaRegistrado: status.HTTP_409_CONFLICT,
    NombreDuplicado: status.HTTP_409_CONFLICT,
    OperacionNoPermitida: status.HTTP_409_CONFLICT,
    RecursoNoEncontrado: status.HTTP_404_NOT_FOUND,
    NoAutorizado: status.HTTP_403_FORBIDDEN,
}


def registrar_manejadores_errores(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def _domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
        codigo = _STATUS_POR_EXCEPCION.get(type(exc), status.HTTP_400_BAD_REQUEST)
        return JSONResponse(status_code=codigo, content={"detail": str(exc)})
