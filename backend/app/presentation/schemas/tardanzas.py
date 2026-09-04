"""Esquemas Pydantic para validación - Módulo Tardanzas (RF-031)."""
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class ScheduleBlockBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    hora_inicio: str = Field(..., pattern=r"^([0-1]\d|2[0-3]):[0-5]\d$")
    hora_fin: str = Field(..., pattern=r"^([0-1]\d|2[0-3]):[0-5]\d$")
    orden: int = Field(0, ge=0)
    cruza_medianoche: bool = False
    es_entrada: bool = True


class ScheduleBlockCreate(ScheduleBlockBase):
    pass


class ScheduleBlockRead(ScheduleBlockBase):
    id: int

    class Config:
        from_attributes = True


class DepartamentoBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    notas: str | None = Field(None, max_length=500)
    activo: bool = True


class DepartamentoCreate(DepartamentoBase):
    pass


class DepartamentoUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=200)
    notas: str | None = Field(None, max_length=500)


class DepartamentoRead(DepartamentoBase):
    id: int
    es_eliminado: bool
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True


class ScheduleBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    tipo_horario: str = Field("FIXED", pattern="^(FIXED|SHIFT)$")
    dias_semana: list[str] = Field(default_factory=list)
    tolerancia_min: int = Field(0, ge=0)
    entradas_esperadas: int | None = Field(None, ge=1)
    salidas_esperadas: int | None = Field(None, ge=1)
    activo: bool = True
    notas: str | None = Field(None, max_length=500)


class ScheduleCreate(ScheduleBase):
    department_id: int = Field(..., gt=0)
    bloques: list[ScheduleBlockCreate] = Field(default_factory=list)


class ScheduleUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=200)
    tipo_horario: str | None = Field(None, pattern="^(FIXED|SHIFT)$")
    dias_semana: list[str] | None = None
    tolerancia_min: int | None = Field(None, ge=0)
    entradas_esperadas: int | None = Field(None, ge=1)
    salidas_esperadas: int | None = Field(None, ge=1)
    notas: str | None = Field(None, max_length=500)


class ScheduleRead(ScheduleBase):
    id: int
    department_id: int
    es_eliminado: bool
    bloques: list[ScheduleBlockRead] = []
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True


class ConfiguracionRead(BaseModel):
    clave: str
    valor: str

    class Config:
        from_attributes = True
