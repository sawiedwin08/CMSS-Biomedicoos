"""Equipo biomédico — entidad núcleo del sistema (Módulo Inventario, RF-001..008)."""
from datetime import date
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    LargeBinary,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.enums.clasificacion_riesgo import ClasificacionRiesgo
from app.domain.enums.estado_equipo import EstadoEquipo
from app.domain.enums.propiedad import Propiedad
from app.infrastructure.db.base import Base
from app.infrastructure.db.types import pg_enum
from app.infrastructure.models.mixins import TimestampMixin


class Equipo(Base, TimestampMixin):
    __tablename__ = "equipos"
    __table_args__ = {"schema": "biomedicos"}

    id: Mapped[int] = mapped_column(primary_key=True)

    # --- Identificación (RF-002) ---
    codigo_interno: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    serial_fabricante: Mapped[str] = mapped_column(String(100), index=True)
    nombre: Mapped[str] = mapped_column(String(200), index=True)
    marca: Mapped[str | None] = mapped_column(String(100))
    modelo: Mapped[str | None] = mapped_column(String(100))
    numero_activo: Mapped[str | None] = mapped_column(String(50), index=True)

    # --- Estado operativo (RF-006) ---
    estado: Mapped[EstadoEquipo] = mapped_column(
        pg_enum(EstadoEquipo, "estado_equipo"),
        default=EstadoEquipo.OPERATIVO,
        server_default=EstadoEquipo.OPERATIVO.value,
    )

    # --- Ubicación (RF-004) ---
    sede_id: Mapped[int | None] = mapped_column(ForeignKey("comun.sedes.id"), index=True)
    servicio_id: Mapped[int | None] = mapped_column(
        ForeignKey("comun.servicios.id"), index=True
    )
    piso: Mapped[str | None] = mapped_column(String(50))

    # --- Clasificación (vocabularios fijos) ---
    clase_biomedica: Mapped[str | None] = mapped_column(String(60))
    clase_uso: Mapped[str | None] = mapped_column(String(40))
    clasificacion_riesgo: Mapped[ClasificacionRiesgo | None] = mapped_column(
        pg_enum(ClasificacionRiesgo, "clasificacion_riesgo")
    )
    tecnologia_predominante: Mapped[str | None] = mapped_column(String(40))

    # --- Fabricante ---
    fabricante: Mapped[str | None] = mapped_column(String(150))
    anio_fabricacion: Mapped[int | None] = mapped_column(Integer)
    pais_fabricante: Mapped[str | None] = mapped_column(String(100))
    ciudad_fabricante: Mapped[str | None] = mapped_column(String(100))
    direccion_fabricante: Mapped[str | None] = mapped_column(String(200))
    telefono_fabricante: Mapped[str | None] = mapped_column(String(50))
    correo_fabricante: Mapped[str | None] = mapped_column(String(150))

    # --- Representante ---
    representante: Mapped[str | None] = mapped_column(String(150))
    pais_representante: Mapped[str | None] = mapped_column(String(100))
    ciudad_representante: Mapped[str | None] = mapped_column(String(100))
    direccion_representante: Mapped[str | None] = mapped_column(String(200))
    telefono_representante: Mapped[str | None] = mapped_column(String(50))
    correo_representante: Mapped[str | None] = mapped_column(String(150))

    # --- Especificaciones técnicas (texto libre: pueden ser descriptivas) ---
    voltaje_operacion: Mapped[str | None] = mapped_column(Text)
    voltaje_maximo: Mapped[str | None] = mapped_column(Text)
    corriente_maxima: Mapped[str | None] = mapped_column(Text)
    corriente_minima: Mapped[str | None] = mapped_column(Text)
    potencia_consumida: Mapped[str | None] = mapped_column(Text)
    frecuencia: Mapped[str | None] = mapped_column(Text)
    presion: Mapped[str | None] = mapped_column(Text)
    velocidad: Mapped[str | None] = mapped_column(Text)
    temperatura: Mapped[str | None] = mapped_column(Text)
    peso: Mapped[str | None] = mapped_column(Text)
    capacidad: Mapped[str | None] = mapped_column(Text)
    fuentes_alimentacion: Mapped[list[str] | None] = mapped_column(ARRAY(String(40)))

    # --- Documentación (selección múltiple) ---
    manuales: Mapped[list[str] | None] = mapped_column(ARRAY(String(40)))
    planos: Mapped[list[str] | None] = mapped_column(ARRAY(String(40)))
    recomendaciones_fabricante: Mapped[list[str] | None] = mapped_column(ARRAY(Text))

    # --- Adquisición y garantía (RF-005) ---
    modo_adquisicion: Mapped[str | None] = mapped_column(String(40))
    propiedad: Mapped[Propiedad | None] = mapped_column(pg_enum(Propiedad, "propiedad"))
    proveedor_id: Mapped[int | None] = mapped_column(ForeignKey("comun.proveedores.id"))
    fecha_adquisicion: Mapped[date | None] = mapped_column(Date)
    costo_adquisicion: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    orden_compra: Mapped[str | None] = mapped_column(String(100))
    fecha_inicial_garantia: Mapped[date | None] = mapped_column(Date)
    fecha_final_garantia: Mapped[date | None] = mapped_column(Date)

    # --- Instalación ---
    fecha_instalacion: Mapped[date | None] = mapped_column(Date)
    fecha_funcionamiento: Mapped[date | None] = mapped_column(Date)

    # --- Registro sanitario (INVIMA, RF-003) ---
    registro_invima: Mapped[str | None] = mapped_column(String(100))
    fecha_vencimiento_invima: Mapped[date | None] = mapped_column(Date)

    # --- Mantenimiento / operación ---
    periodicidad_mantenimiento: Mapped[str | None] = mapped_column(String(100))
    # Fecha de último mantenimiento realizado (manual; si es NULL se deriva de las OT).
    fecha_ultimo_mantenimiento: Mapped[date | None] = mapped_column(Date)
    calibracion_si: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    calibracion_no: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    equipo_movil: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    equipo_fijo: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    accesorios: Mapped[str | None] = mapped_column(Text)
    descripcion_funcional: Mapped[str | None] = mapped_column(Text)

    # --- Foto del equipo (para la hoja de vida) ---
    # 'foto' es diferida: no se carga en los listados, solo al pedirla.
    foto_mime: Mapped[str | None] = mapped_column(String(50))
    foto: Mapped[bytes | None] = mapped_column(LargeBinary, deferred=True)

    # --- Relaciones ---
    sede: Mapped["Sede | None"] = relationship()  # noqa: F821
    servicio: Mapped["Servicio | None"] = relationship()  # noqa: F821
    proveedor: Mapped["Proveedor | None"] = relationship()  # noqa: F821
    documentos: Mapped[list["DocumentoEquipo"]] = relationship(  # noqa: F821
        back_populates="equipo", cascade="all, delete-orphan"
    )
