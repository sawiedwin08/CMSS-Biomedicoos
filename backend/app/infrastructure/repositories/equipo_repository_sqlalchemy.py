"""Implementación SQLAlchemy del puerto EquipoRepository (RF-001..007)."""
from sqlalchemy import or_, select, text
from sqlalchemy.orm import Session

from app.application.dto.equipos import FiltroEquipos
from app.domain.entities.equipo import Equipo
from app.domain.exceptions import RecursoNoEncontrado
from app.infrastructure.models.equipo import Equipo as EquipoModel

# Campos que se copian igual entre entidad y modelo (sin transformación).
_CAMPOS = (
    "codigo_interno", "serial_fabricante", "nombre", "estado", "marca", "modelo",
    "numero_activo", "sede_id", "servicio_id", "piso", "clase_biomedica", "clase_uso",
    "clasificacion_riesgo", "tecnologia_predominante", "fabricante", "anio_fabricacion",
    "pais_fabricante", "ciudad_fabricante", "direccion_fabricante", "telefono_fabricante",
    "correo_fabricante", "representante", "pais_representante", "ciudad_representante",
    "direccion_representante", "telefono_representante", "correo_representante",
    "voltaje_operacion", "voltaje_maximo", "corriente_maxima", "corriente_minima",
    "potencia_consumida", "frecuencia", "presion", "velocidad", "temperatura", "peso",
    "capacidad", "fuentes_alimentacion", "manuales", "planos", "recomendaciones_fabricante",
    "modo_adquisicion", "propiedad", "proveedor_id", "fecha_adquisicion", "costo_adquisicion",
    "orden_compra", "fecha_inicial_garantia", "fecha_final_garantia", "fecha_instalacion",
    "fecha_funcionamiento", "registro_invima", "fecha_vencimiento_invima",
    "periodicidad_mantenimiento", "calibracion_si", "calibracion_no", "equipo_movil",
    "equipo_fijo", "accesorios", "descripcion_funcional",
)
# Campos de tipo lista que deben normalizarse a [] cuando la BD devuelve NULL.
_LISTAS = ("fuentes_alimentacion", "manuales", "planos", "recomendaciones_fabricante")


class EquipoRepositorySQLAlchemy:
    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _a_entidad(m: EquipoModel) -> Equipo:
        valores = {campo: getattr(m, campo) for campo in _CAMPOS}
        for campo in _LISTAS:
            valores[campo] = valores[campo] or []
        return Equipo(
            id=m.id,
            **valores,
            foto_mime=m.foto_mime,
            sede_nombre=m.sede.nombre if m.sede else None,
            servicio_nombre=m.servicio.nombre if m.servicio else None,
            proveedor_nombre=m.proveedor.nombre if m.proveedor else None,
        )

    @staticmethod
    def _campos(e: Equipo) -> dict:
        return {campo: getattr(e, campo) for campo in _CAMPOS}

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
                    EquipoModel.numero_activo.ilike(patron),
                )
            )
        if filtro.sede_id is not None:
            stmt = stmt.where(EquipoModel.sede_id == filtro.sede_id)
        if filtro.servicio_id is not None:
            stmt = stmt.where(EquipoModel.servicio_id == filtro.servicio_id)
        if filtro.estado is not None:
            stmt = stmt.where(EquipoModel.estado == filtro.estado)
        if filtro.propiedad is not None:
            stmt = stmt.where(EquipoModel.propiedad == filtro.propiedad)
        if filtro.clasificacion_riesgo is not None:
            stmt = stmt.where(EquipoModel.clasificacion_riesgo == filtro.clasificacion_riesgo)
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

    # --- Foto del equipo ---
    def guardar_foto(self, equipo_id: int, contenido: bytes, mime: str) -> None:
        model = self._session.get(EquipoModel, equipo_id)
        if model is None:
            raise RecursoNoEncontrado(f"El equipo {equipo_id} no existe.")
        model.foto = contenido
        model.foto_mime = mime
        self._session.commit()

    def obtener_foto(self, equipo_id: int) -> tuple[bytes, str] | None:
        model = self._session.get(EquipoModel, equipo_id)
        if model is None or model.foto is None:
            return None
        return model.foto, (model.foto_mime or "application/octet-stream")

    def eliminar_foto(self, equipo_id: int) -> None:
        model = self._session.get(EquipoModel, equipo_id)
        if model is None:
            raise RecursoNoEncontrado(f"El equipo {equipo_id} no existe.")
        model.foto = None
        model.foto_mime = None
        self._session.commit()
