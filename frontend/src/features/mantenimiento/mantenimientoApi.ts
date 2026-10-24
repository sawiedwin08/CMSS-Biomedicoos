/**
 * Cliente HTTP para gestionar mantenimiento y órdenes de trabajo (RF-013).
 * Endpoints: POST|GET|PUT|PATCH|DELETE /mantenimiento/...
 */
import { api } from '../../shared/api/client'

export type TipoMantenimiento = 'preventivo' | 'correctivo' | 'calibracion' | 'otra'
export type EstadoOT = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
export type EstadoChecklist = 'R' | 'NR' | 'PA'

export interface ChecklistPasoRead {
  id: number
  checklist_id: number
  orden: number
  descripcion: string
  instrucciones: string | null
}

export interface ChecklistEquipoRead {
  id: number
  equipo_id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  pasos: ChecklistPasoRead[]
  created_at: string
  updated_at: string
}

export interface OTRead {
  id: number
  equipo_id: number
  equipo_nombre?: string
  equipo_codigo?: string
  tipo: TipoMantenimiento
  estado: EstadoOT
  descripcion: string | null
  observaciones: string | null
  tecnico_id: number | null
  tecnico_nombre: string | null
  fecha_programada: string | null
  fecha_inicio: string | null
  fecha_cierre: string | null
  tiempo_empleado_minutos: number | null
  costo_total: number | null
  repuestos: string | null
  fecha_firma_coordinador: string | null
  fecha_firma_tecnico: string | null
  created_at: string
  updated_at: string
}

export interface OTCreate {
  tipo: TipoMantenimiento
  descripcion?: string
  observaciones?: string
  tecnico_id?: number
  tecnico_nombre?: string
  fecha_programada?: string
  tiempo_empleado_minutos?: number
  costo_total?: number
  repuestos?: string
}

export interface ChecklistPasoCreate {
  orden: number
  descripcion: string
  instrucciones?: string
}

export interface ChecklistEquipoCreate {
  nombre: string
  descripcion?: string
  pasos: ChecklistPasoCreate[]
}

export interface EjecucionPasoCreate {
  paso_id: number
  estado: EstadoChecklist
  observacion?: string
}

export interface EjecucionPasoRead extends EjecucionPasoCreate {
  id: number
  ot_id: number
}

/**
 * Crear una nueva orden de trabajo.
 */
export async function crearOrdenTrabajo(
  equipoId: number,
  datos: OTCreate
): Promise<OTRead> {
  const { data } = await api.post<OTRead>(
    `/mantenimiento/equipos/${equipoId}/ordenes-trabajo`,
    datos
  )
  return data
}

export interface OTLoteResultado {
  creadas: number
  errores: { equipo_id: number; error: string }[]
}

export interface PasoPlantilla {
  orden: number
  descripcion: string
  instrucciones?: string | null
}

export interface PlantillaRutina {
  id: number
  nombre: string
  pasos: PasoPlantilla[]
}

export interface CambioEstadoLoteResultado {
  actualizadas: number
  omitidas: number
}

/** Cambia el estado de varias OT a la vez (las completadas se omiten). */
export async function cambiarEstadoLote(
  otIds: number[],
  nuevoEstado: EstadoOT,
): Promise<CambioEstadoLoteResultado> {
  const { data } = await api.patch<CambioEstadoLoteResultado>(
    '/mantenimiento/ordenes-trabajo/estado-lote',
    { ot_ids: otIds, nuevo_estado: nuevoEstado },
  )
  return data
}

/** Lista las plantillas de rutina guardadas. */
export async function listarPlantillasRutina(): Promise<PlantillaRutina[]> {
  const { data } = await api.get<PlantillaRutina[]>('/mantenimiento/plantillas-rutina')
  return data
}

/** Guarda una rutina como plantilla reutilizable. */
export async function crearPlantillaRutina(
  nombre: string,
  pasos: PasoPlantilla[],
): Promise<PlantillaRutina> {
  const { data } = await api.post<PlantillaRutina>('/mantenimiento/plantillas-rutina', {
    nombre,
    pasos,
  })
  return data
}

/**
 * Crear órdenes de trabajo en lote: una por cada equipo.
 */
export async function crearOrdenesLote(
  equipoIds: number[],
  datos: Partial<OTCreate>,
): Promise<OTLoteResultado> {
  const { data } = await api.post<OTLoteResultado>('/mantenimiento/ordenes-trabajo/lote', {
    ...datos,
    equipo_ids: equipoIds,
  })
  return data
}

/**
 * Obtener todas las órdenes de trabajo del sistema.
 */
export async function obtenerTodasOrdenesTrabajo(
  estado?: EstadoOT
): Promise<OTRead[]> {
  const params = estado ? { estado } : {}
  const { data } = await api.get<OTRead[]>(
    `/mantenimiento/ordenes-trabajo`,
    { params }
  )
  return data
}

/**
 * Obtener órdenes de trabajo de un equipo.
 */
export async function obtenerOrdenesTrabajo(
  equipoId: number,
  estado?: EstadoOT
): Promise<OTRead[]> {
  const params = estado ? { estado } : {}
  const { data } = await api.get<OTRead[]>(
    `/mantenimiento/equipos/${equipoId}/ordenes-trabajo`,
    { params }
  )
  return data
}

/**
 * Obtener detalle de una orden de trabajo.
 */
export async function obtenerOrdenTrabajo(otId: number): Promise<OTRead> {
  const { data } = await api.get<OTRead>(`/mantenimiento/ordenes-trabajo/${otId}`)
  return data
}

/**
 * Actualizar una orden de trabajo.
 */
export async function actualizarOrdenTrabajo(
  otId: number,
  datos: Partial<OTCreate>
): Promise<OTRead> {
  const { data } = await api.put<OTRead>(
    `/mantenimiento/ordenes-trabajo/${otId}`,
    datos
  )
  return data
}

/**
 * Cambiar estado de una orden de trabajo.
 */
export async function cambiarEstadoOT(
  otId: number,
  nuevoEstado: EstadoOT
): Promise<OTRead> {
  const { data } = await api.patch<OTRead>(
    `/mantenimiento/ordenes-trabajo/${otId}/estado`,
    { nuevo_estado: nuevoEstado }
  )
  return data
}

/**
 * Guarda el PDF diligenciado de la hoja de rutina en la carpeta de mantenimiento del equipo.
 */
export async function guardarPdfHojaRutina(otId: number, pdf: Blob): Promise<void> {
  const fd = new FormData()
  fd.append('archivo', pdf, `OT-${otId}.pdf`)
  await api.post(`/mantenimiento/ordenes-trabajo/${otId}/pdf`, fd)
}

/**
 * Eliminar una orden de trabajo.
 */
export async function eliminarOrdenTrabajo(otId: number): Promise<void> {
  await api.delete(`/mantenimiento/ordenes-trabajo/${otId}`)
}

/**
 * Crear un checklist para un equipo.
 */
export async function crearChecklist(
  equipoId: number,
  datos: ChecklistEquipoCreate
): Promise<ChecklistEquipoRead> {
  const { data } = await api.post<ChecklistEquipoRead>(
    `/mantenimiento/equipos/${equipoId}/checklist`,
    datos
  )
  return data
}

/**
 * Obtener checklist de un equipo.
 */
export async function obtenerChecklist(
  equipoId: number
): Promise<ChecklistEquipoRead | null> {
  const { data } = await api.get<ChecklistEquipoRead | null>(
    `/mantenimiento/equipos/${equipoId}/checklist`
  )
  return data
}

/**
 * Registrar ejecución de un paso del checklist.
 */
export async function registrarEjecucionPaso(
  otId: number,
  datos: EjecucionPasoCreate
): Promise<void> {
  await api.post(`/mantenimiento/ordenes-trabajo/${otId}/pasos`, datos)
}

/**
 * Obtener ejecución de checklist en una OT.
 */
export async function obtenerEjecucionOT(otId: number): Promise<EjecucionPasoRead[]> {
  const { data } = await api.get<EjecucionPasoRead[]>(
    `/mantenimiento/ordenes-trabajo/${otId}/pasos`
  )
  return data
}
