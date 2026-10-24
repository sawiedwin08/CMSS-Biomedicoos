"""Schemas Pydantic para equipos (RF-001..007)."""
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums.clase_biomedica import ClaseBiomedica
from app.domain.enums.clase_uso import ClaseUso
from app.domain.enums.clasificacion_riesgo import ClasificacionRiesgo
from app.domain.enums.estado_equipo import EstadoEquipo
from app.domain.enums.fuente_alimentacion import FuenteAlimentacion
from app.domain.enums.manual_tipo import ManualTipo
from app.domain.enums.modo_adquisicion import ModoAdquisicion
from app.domain.enums.plano_tipo import PlanoTipo
from app.domain.enums.propiedad import Propiedad
from app.domain.enums.tecnologia_predominante import TecnologiaPredominante


class EquipoBase(BaseModel):
    # --- Identificación ---
    # Opcional al crear: si viene vacío, el sistema genera 'EQ-0001'.
    codigo_interno: str | None = Field(default=None, max_length=50)
    serial_fabricante: str = Field(min_length=1, max_length=100)
    nombre: str = Field(min_length=2, max_length=200)
    estado: EstadoEquipo = EstadoEquipo.OPERATIVO
    marca: str | None = Field(default=None, max_length=100)
    modelo: str | None = Field(default=None, max_length=100)
    numero_activo: str | None = Field(default=None, max_length=50)

    # --- Ubicación ---
    sede_id: int | None = None
    servicio_id: int | None = None
    piso: str | None = Field(default=None, max_length=50)

    # --- Clasificación ---
    clase_biomedica: ClaseBiomedica | None = None
    clase_uso: ClaseUso | None = None
    clasificacion_riesgo: ClasificacionRiesgo | None = None
    tecnologia_predominante: TecnologiaPredominante | None = None

    # --- Fabricante ---
    fabricante: str | None = Field(default=None, max_length=150)
    anio_fabricacion: int | None = Field(default=None, ge=1900, le=2100)
    pais_fabricante: str | None = Field(default=None, max_length=100)
    ciudad_fabricante: str | None = Field(default=None, max_length=100)
    direccion_fabricante: str | None = Field(default=None, max_length=200)
    telefono_fabricante: str | None = Field(default=None, max_length=50)
    correo_fabricante: str | None = Field(default=None, max_length=150)

    # --- Representante ---
    representante: str | None = Field(default=None, max_length=150)
    pais_representante: str | None = Field(default=None, max_length=100)
    ciudad_representante: str | None = Field(default=None, max_length=100)
    direccion_representante: str | None = Field(default=None, max_length=200)
    telefono_representante: str | None = Field(default=None, max_length=50)
    correo_representante: str | None = Field(default=None, max_length=150)

    # --- Especificaciones técnicas (texto libre, pueden ser descriptivas) ---
    voltaje_operacion: str | None = None
    voltaje_maximo: str | None = None
    corriente_maxima: str | None = None
    corriente_minima: str | None = None
    potencia_consumida: str | None = None
    frecuencia: str | None = None
    presion: str | None = None
    velocidad: str | None = None
    temperatura: str | None = None
    peso: str | None = None
    capacidad: str | None = None
    fuentes_alimentacion: list[FuenteAlimentacion] = Field(default_factory=list)

    # --- Documentación ---
    manuales: list[ManualTipo] = Field(default_factory=list)
    planos: list[PlanoTipo] = Field(default_factory=list)
    recomendaciones_fabricante: list[str] = Field(default_factory=list)

    # --- Adquisición y garantía ---
    modo_adquisicion: ModoAdquisicion | None = None
    propiedad: Propiedad | None = None
    proveedor_id: int | None = None
    fecha_adquisicion: date | None = None
    costo_adquisicion: Decimal | None = None
    orden_compra: str | None = Field(default=None, max_length=100)
    fecha_inicial_garantia: date | None = None
    fecha_final_garantia: date | None = None

    # --- Instalación ---
    fecha_instalacion: date | None = None
    fecha_funcionamiento: date | None = None

    # --- Registro sanitario (INVIMA) ---
    registro_invima: str | None = Field(default=None, max_length=100)
    fecha_vencimiento_invima: date | None = None

    # --- Mantenimiento / operación ---
    periodicidad_mantenimiento: str | None = Field(default=None, max_length=100)
    fecha_ultimo_mantenimiento: date | None = None
    calibracion_si: bool = False
    calibracion_no: bool = False
    equipo_movil: bool = False
    equipo_fijo: bool = False
    accesorios: str | None = None
    descripcion_funcional: str | None = None


class EquipoCreate(EquipoBase):
    pass


class EquipoUpdate(EquipoBase):
    # En edición el código ya existe y es obligatorio.
    codigo_interno: str = Field(min_length=1, max_length=50)


class EquipoRead(EquipoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo_interno: str
    foto_mime: str | None = None
    sede_nombre: str | None = None
    servicio_nombre: str | None = None
    proveedor_nombre: str | None = None
    # Último mantenimiento efectivo (manual o derivado de la última OT completada).
    ultimo_mantenimiento_efectivo: date | None = None


class ErrorFilaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    fila: int
    mensaje: str


class ImportacionResultado(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total: int
    creados: int
    errores: list[ErrorFilaRead]
