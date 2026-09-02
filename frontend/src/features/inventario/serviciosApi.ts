import type { Servicio } from '../../entities/servicio'
import { api } from '../../shared/api/client'

export interface DatosServicio {
  nombre: string
  sede_id: number
  activo: boolean
}

export async function listarServicios(): Promise<Servicio[]> {
  const { data } = await api.get<Servicio[]>('/servicios')
  return data
}

export async function crearServicio(payload: DatosServicio): Promise<Servicio> {
  const { data } = await api.post<Servicio>('/servicios', payload)
  return data
}

export async function actualizarServicio(
  id: number,
  payload: DatosServicio,
): Promise<Servicio> {
  const { data } = await api.put<Servicio>(`/servicios/${id}`, payload)
  return data
}

export async function eliminarServicio(id: number): Promise<void> {
  await api.delete(`/servicios/${id}`)
}
