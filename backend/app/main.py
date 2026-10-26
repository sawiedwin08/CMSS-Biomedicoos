"""Punto de entrada de la API — Sistema de Gestión de Activos Biomédicos + Asistencia."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings

# Frontend compilado: si existe, el backend lo sirve (una sola dirección en producción).
_FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
from app.presentation.api.errors import registrar_manejadores_errores
from app.presentation.api.v1.routers import (
    auth,
    equipos,
    mantenimiento,
    mesa_ayuda,
    modulos,
    notificaciones,
    permisos,
    proveedores,
    representantes,
    roles,
    sedes,
    servicios,
    sistemas,
    sistemas_cuentas,
    sistemas_inicio,
    sistemas_red,
    soporte,
    usuarios,
)


def crear_app() -> FastAPI:
    app = FastAPI(
        title="CMSS-Biomédico + Asistencia API",
        description=(
            "API del Sistema de Gestión de Activos Biomédicos + Módulo de Asistencia y Tardanzas. "
            "Documentación interactiva generada automáticamente (Swagger / OpenAPI)."
        ),
        version="1.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    print(f"CORS origins: {settings.cors_origins}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    registrar_manejadores_errores(app)

    # Routers versionados - CMSS (con autenticación)
    app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
    app.include_router(usuarios.router, prefix=settings.API_V1_PREFIX)
    app.include_router(roles.router, prefix=settings.API_V1_PREFIX)
    app.include_router(permisos.router, prefix=settings.API_V1_PREFIX)
    app.include_router(sedes.router, prefix=settings.API_V1_PREFIX)
    app.include_router(servicios.router, prefix=settings.API_V1_PREFIX)
    app.include_router(proveedores.router, prefix=settings.API_V1_PREFIX)
    app.include_router(representantes.router, prefix=settings.API_V1_PREFIX)
    app.include_router(equipos.router, prefix=settings.API_V1_PREFIX)
    app.include_router(mantenimiento.router, prefix=settings.API_V1_PREFIX)
    app.include_router(modulos.router, prefix=settings.API_V1_PREFIX)
    app.include_router(sistemas.router, prefix=settings.API_V1_PREFIX)
    app.include_router(sistemas_red.router, prefix=settings.API_V1_PREFIX)
    app.include_router(sistemas_cuentas.router, prefix=settings.API_V1_PREFIX)
    app.include_router(mesa_ayuda.router, prefix=settings.API_V1_PREFIX)
    app.include_router(soporte.router, prefix=settings.API_V1_PREFIX)
    app.include_router(sistemas_inicio.router, prefix=settings.API_V1_PREFIX)
    app.include_router(notificaciones.router, prefix=settings.API_V1_PREFIX)


    @app.get("/health", tags=["Sistema"], summary="Estado del servicio")
    def health() -> dict[str, str]:
        return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}

    # --- Producción: servir la SPA compilada desde el mismo backend ---
    if _FRONTEND_DIST.exists():
        if (_FRONTEND_DIST / "assets").exists():
            app.mount(
                "/assets", StaticFiles(directory=_FRONTEND_DIST / "assets"), name="assets"
            )

        @app.get("/{full_path:path}", include_in_schema=False, response_model=None)
        def servir_spa(full_path: str):
            # Las rutas de la API no las maneja la SPA.
            if full_path.startswith("api/"):
                return RedirectResponse(url="/health")
            archivo = _FRONTEND_DIST / full_path
            if full_path and archivo.is_file():
                return FileResponse(archivo)
            return FileResponse(_FRONTEND_DIST / "index.html")
    else:

        @app.get("/", include_in_schema=False)
        def raiz() -> RedirectResponse:
            destino = "/docs" if settings.DEBUG else "/health"
            return RedirectResponse(url=destino)

    return app


app = crear_app()
