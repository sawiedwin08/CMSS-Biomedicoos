"""Punto de entrada de la API — Sistema de Gestión de Activos Biomédicos."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.presentation.api.errors import registrar_manejadores_errores
from app.presentation.api.v1.routers import auth, permisos, roles, usuarios


def crear_app() -> FastAPI:
    app = FastAPI(
        title="CMSS-Biomédico API",
        description=(
            "API del Sistema de Gestión de Activos Biomédicos. "
            "Documentación interactiva generada automáticamente (Swagger / OpenAPI)."
        ),
        version="0.1.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    registrar_manejadores_errores(app)

    # Routers versionados
    app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
    app.include_router(usuarios.router, prefix=settings.API_V1_PREFIX)
    app.include_router(roles.router, prefix=settings.API_V1_PREFIX)
    app.include_router(permisos.router, prefix=settings.API_V1_PREFIX)

    @app.get("/", include_in_schema=False)
    def raiz() -> RedirectResponse:
        # Redirige la raíz a la documentación interactiva (o a /health si docs está off).
        destino = "/docs" if settings.DEBUG else "/health"
        return RedirectResponse(url=destino)

    @app.get("/health", tags=["Sistema"], summary="Estado del servicio")
    def health() -> dict[str, str]:
        return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}

    return app


app = crear_app()
