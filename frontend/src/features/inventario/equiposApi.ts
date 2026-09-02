import type {
  ClasificacionRiesgo,
  Criticidad,
  Equipo,
  EstadoEquipo,
  Propiedad,
} from '../../entities/equipo'
import { api } from '../../shared/api/client'

export interface DatosEquipo {
  codigo_interno: string
  serial_fabricante: string
  nombre: string
  estado: EstadoEquipo
  marca: string | null
  modelo: string | null
  criticidad: Criticidad | null
  registro_invima: string | null
  clasificacion_riesgo: ClasificacionRiesgo | null
  propiedad: Propiedad | null
  sede_id: number | null
  servicio_id: number | null
  proveedor_id: number | null
  fecha_adquisicion: string | null
  costo_adquisicion: string | null
  fin_garantia: string | null
  orden_compra: string | null
}

export interface FiltroEquipos {
  texto?: string
  sede_id?: number
  estado?: EstadoEquipo
  criticidad?: Criticidad
  propiedad?: Propiedad
}

export async function listarEquipos(filtro: FiltroEquipos = {}): Promise<Equipo[]> {
  const params: Record<string, string | number> = {}
  if (filtro.texto) params.texto = filtro.texto
  if (filtro.sede_id) params.sede_id = filtro.sede_id
  if (filtro.estado) params.estado = filtro.estado
  if (filtro.criticidad) params.criticidad = filtro.criticidad
  if (filtro.propiedad) params.propiedad = filtro.propiedad
  const { data } = await api.get<Equipo[]>('/equipos', { params })
  return data
}

export async function crearEquipo(payload: DatosEquipo): Promise<Equipo> {
  const { data } = await api.post<Equipo>('/equipos', payload)
  return data
}

export async function actualizarEquipo(
  id: number,
  payload: DatosEquipo,
): Promise<Equipo> {
  const { data } = await api.put<Equipo>(`/equipos/${id}`, payload)
  return data
}

export async function eliminarEquipo(id: number): Promise<void> {
  await api.delete(`/equipos/${id}`)
}

export interface ResultadoImportacion {
  total: number
  creados: number
  errores: { fila: number; mensaje: string }[]
}

export async function importarEquipos(archivo: File): Promise<ResultadoImportacion> {
  const fd = new FormData()
  fd.append('archivo', archivo)
  const { data } = await api.post<ResultadoImportacion>('/equipos/importar', fd)
  return data
}

export async function descargarPlantilla(): Promise<void> {
  const res = await api.get('/equipos/plantilla', { responseType: 'blob' })
  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'plantilla_equipos.xlsx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
