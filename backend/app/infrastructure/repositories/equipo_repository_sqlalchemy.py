"""Implementación SQLAlchemy del puerto EquipoRepository (RF-001..007)."""
from sqlalchemy import or_, select, text
from sqlalchemy.orm import Session

from app.application.dto.equipos import FiltroEquipos
from app.domain.entities.equipo import Equipo
from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.equipo import Equipo as EquipoModel


class EquipoRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _a_entidad(m: EquipoModel) -> Equipo:
        return Equipo(
            id=m.id,
            codigo_interno=m.codigo_interno,
            serial_fabricante=m.serial_fabricante,
            nombre=m.nombre,
            estado=m.estado,
            marca=m.marca,
            modelo=m.modelo,
            criticidad=m.criticidad,
            registro_invima=m.registro_invima,
            clasificacion_riesgo=m.clasificacion_riesgo,
            propiedad=m.propiedad,
            sede_id=m.sede_id,
            servicio_id=m.servicio_id,
            proveedor_id=m.proveedor_id,
            fecha_adquisicion=m.fecha_adquisicion,
            costo_adquisicion=m.costo_adquisicion,
            fin_garantia=m.fin_garantia,
            orden_compra=m.orden_compra,
            sede_nombre=m.sede.nombre if m.sede else None,
            servicio_nombre=m.servicio.nombre if m.servicio else None,
            proveedor_nombre=m.proveedor.nombre if m.proveedor else None,
        )

    def listar(self, filtro: FiltroEquipos) -> list[Equipo]:
        stmt = select(EquipoModel)
        if filtro.texto:
            patron = f"%{filtro.texto.strip()}%"
            stmt = stmt.where(
                or_(
                    EquipoModel.nombre.ilike(patron),
                    EquipoModel.codigo_interno.ilike(patron),
                    EquipoModel.serial_fabricante.ilike(patron),
                    EquipoModel.marca.ilike(patron),
                )
            )
        if filtro.sede_id is not None:
            stmt = stmt.where(EquipoModel.sede_id == filtro.sede_id)
        if filtro.servicio_id is not None:
            stmt = stmt.where(EquipoModel.servicio_id == filtro.servicio_id)
        if filtro.estado is not None:
            stmt = stmt.where(EquipoModel.estado == filtro.estado)
        if filtro.criticidad is not None:
            stmt = stmt.where(EquipoModel.criticidad == filtro.criticidad)
        if filtro.propiedad is not None:
            stmt = stmt.where(EquipoModel.propiedad == filtro.propiedad)
        stmt = stmt.order_by(EquipoModel.codigo_interno)
        return [self._a_entidad(m) for m in self._session.scalars(stmt)]

    def obtener_por_id(self, equipo_id: int) -> Equipo | None:
        model = self._session.get(EquipoModel, equipo_id)
        return self._a_entidad(model) if model else None

    def existe_codigo(self, codigo: str, excluir_id: int | None = None) -> bool:
        stmt = select(EquipoModel.id).where(EquipoModel.codigo_interno == codigo)
        if excluir_id is not None:
            stmt = stmt.where(EquipoModel.id != excluir_id)
        return self._session.scalar(stmt) is not None

    def siguiente_codigo(self) -> str:
        """Genera el próximo código 'EQ-NNNN' usando una secuencia de la BD.

        Si un valor generado ya existe (porque alguien lo escribió manualmente),
        avanza la secuencia hasta encontrar uno libre.
        """
        for _ in range(1000):  # tope de seguridad ante huecos
            numero = self._session.execute(
                text("SELECT nextval('equipo_codigo_seq')")
            ).scalar_one()
            codigo = f"EQ-{numero:04d}"
            if not self.existe_codigo(codigo):
                return codigo
        raise RuntimeError("No se pudo generar un código interno único.")

    def crear(self, equipo: Equipo) -> Equipo:
        model = EquipoModel(**self._campos(equipo))
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def actualizar(self, equipo_id: int, datos: Equipo) -> Equipo:
        model = self._session.get(EquipoModel, equipo_id)
        if model is None:
            raise RecursoNoEncontrado(f"El equipo {equipo_id} no existe.")
        for campo, valor in self._campos(datos).items():
            setattr(model, campo, valor)
        self._session.commit()
        self._session.refresh(model)
        return self._a_entidad(model)

    def eliminar(self, equipo_id: int) -> None:
        model = self._session.get(EquipoModel, equipo_id)
        if model is None:
            raise RecursoNoEncontrado(f"El equipo {equipo_id} no existe.")
        self._session.delete(model)
        self._session.commit()

    @staticmethod
    def _campos(e: Equipo) -> dict:
        return {
            "codigo_interno": e.codigo_interno,
            "serial_fabricante": e.serial_fabricante,
            "nombre": e.nombre,
            "estado": e.estado,
            "marca": e.marca,
            "modelo": e.modelo,
            "criticidad": e.criticidad,
            "registro_invima": e.registro_invima,
            "clasificacion_riesgo": e.clasificacion_riesgo,
            "propiedad": e.propiedad,
            "sede_id": e.sede_id,
            "servicio_id": e.servicio_id,
            "proveedor_id": e.proveedor_id,
            "fecha_adquisicion": e.fecha_adquisicion,
            "costo_adquisicion": e.costo_adquisicion,
            "fin_garantia": e.fin_garantia,
            "orden_compra": e.orden_compra,
        }
