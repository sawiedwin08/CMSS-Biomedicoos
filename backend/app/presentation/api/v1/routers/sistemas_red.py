"""Router — Redes e infraestructura (enlaces de internet + direccionamiento IP)."""
from fastapi import APIRouter, Depends, status

from app.presentation.api.deps import EnlaceRepo, SedeRepo, require_permiso
from app.presentation.schemas.red import EnlaceCreate, EnlaceRead, EnlaceUpdate, IpEnUso

router = APIRouter(prefix="/sistemas/red", tags=["Sistemas · Redes e infraestructura"])


def _sede_nombre(sedes: SedeRepo, sede_id: int | None) -> str | None:
    if not sede_id:
        return None
    s = sedes.obtener_por_id(sede_id)
    return s.nombre if s else None


def _read(enlace, sede_nombre: str | None) -> EnlaceRead:
    r = EnlaceRead.model_validate(enlace)
    r.sede_nombre = sede_nombre
    return r


@router.get(
    "/enlaces",
    response_model=list[EnlaceRead],
    summary="Listar enlaces de internet (ISP)",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def listar_enlaces(enlaces: EnlaceRepo) -> list[EnlaceRead]:
    return [_read(e, nombre) for e, nombre in enlaces.listar()]


@router.post(
    "/enlaces",
    response_model=EnlaceRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar enlace de internet",
    dependencies=[Depends(require_permiso("sistemas:crear"))],
)
def crear_enlace(datos: EnlaceCreate, enlaces: EnlaceRepo, sedes: SedeRepo) -> EnlaceRead:
    e = enlaces.crear(datos.model_dump())
    return _read(e, _sede_nombre(sedes, e.sede_id))


@router.put(
    "/enlaces/{enlace_id}",
    response_model=EnlaceRead,
    summary="Editar enlace de internet",
    dependencies=[Depends(require_permiso("sistemas:editar"))],
)
def actualizar_enlace(
    enlace_id: int, datos: EnlaceUpdate, enlaces: EnlaceRepo, sedes: SedeRepo
) -> EnlaceRead:
    e = enlaces.actualizar(enlace_id, datos.model_dump())
    return _read(e, _sede_nombre(sedes, e.sede_id))


@router.delete(
    "/enlaces/{enlace_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar enlace de internet",
    dependencies=[Depends(require_permiso("sistemas:eliminar"))],
)
def eliminar_enlace(enlace_id: int, enlaces: EnlaceRepo) -> None:
    enlaces.eliminar(enlace_id)


@router.get(
    "/ips",
    response_model=list[IpEnUso],
    summary="Direccionamiento IP (IPs en uso + duplicadas)",
    dependencies=[Depends(require_permiso("sistemas:ver"))],
)
def direccionamiento_ip(enlaces: EnlaceRepo) -> list[IpEnUso]:
    return [IpEnUso(**d) for d in enlaces.ips_en_uso()]
