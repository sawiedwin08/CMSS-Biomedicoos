"""Repositorio SQLAlchemy para enlaces de internet + direccionamiento IP."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.activo import Activo as ActivoModel
from app.infrastructure.models.enlace_internet import EnlaceInternet
from app.infrastructure.models.sede import Sede as SedeModel


class EnlaceInternetRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    def listar(self) -> list[tuple[EnlaceInternet, str | None]]:
        stmt = (
            select(EnlaceInternet, SedeModel.nombre)
            .join(SedeModel, EnlaceInternet.sede_id == SedeModel.id, isouter=True)
            .order_by(EnlaceInternet.proveedor)
        )
        return [(row[0], row[1]) for row in self._session.execute(stmt).all()]

    def obtener_por_id(self, enlace_id: int) -> EnlaceInternet | None:
        return self._session.get(EnlaceInternet, enlace_id)

    def crear(self, datos: dict) -> EnlaceInternet:
        enlace = EnlaceInternet(**datos)
        self._session.add(enlace)
        self._session.commit()
        self._session.refresh(enlace)
        return enlace

    def actualizar(self, enlace_id: int, datos: dict) -> EnlaceInternet:
        enlace = self._session.get(EnlaceInternet, enlace_id)
        if enlace is None:
            raise RecursoNoEncontrado(f"El enlace {enlace_id} no existe.")
        for campo, valor in datos.items():
            setattr(enlace, campo, valor)
        self._session.commit()
        self._session.refresh(enlace)
        return enlace

    def eliminar(self, enlace_id: int) -> None:
        enlace = self._session.get(EnlaceInternet, enlace_id)
        if enlace is None:
            raise RecursoNoEncontrado(f"El enlace {enlace_id} no existe.")
        self._session.delete(enlace)
        self._session.commit()

    def ips_en_uso(self) -> list[dict]:
        """IPs de los equipos del inventario + IPs públicas de los enlaces."""
        resultado: list[dict] = []

        stmt_a = (
            select(
                ActivoModel.ip,
                ActivoModel.codigo_interno,
                ActivoModel.nombre,
                SedeModel.nombre,
            )
            .join(SedeModel, ActivoModel.sede_id == SedeModel.id, isouter=True)
            .where(ActivoModel.ip.isnot(None), ActivoModel.ip != "")
        )
        for ip, codigo, nombre, sede in self._session.execute(stmt_a).all():
            resultado.append(
                {
                    "ip": ip,
                    "origen": "equipo",
                    "referencia": f"{codigo} — {nombre}",
                    "sede": sede,
                }
            )

        stmt_e = (
            select(EnlaceInternet.ip_publica, EnlaceInternet.proveedor, SedeModel.nombre)
            .join(SedeModel, EnlaceInternet.sede_id == SedeModel.id, isouter=True)
            .where(EnlaceInternet.ip_publica.isnot(None), EnlaceInternet.ip_publica != "")
        )
        for ip, proveedor, sede in self._session.execute(stmt_e).all():
            resultado.append(
                {
                    "ip": ip,
                    "origen": "enlace",
                    "referencia": f"Enlace: {proveedor}",
                    "sede": sede,
                }
            )

        # Marca duplicadas
        conteo: dict[str, int] = {}
        for r in resultado:
            conteo[r["ip"]] = conteo.get(r["ip"], 0) + 1
        for r in resultado:
            r["duplicada"] = conteo[r["ip"]] > 1
        resultado.sort(key=lambda r: r["ip"])
        return resultado
