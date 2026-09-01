import type { Sede } from '../../entities/sede'
import { api } from '../../shared/api/client'

export interface DatosSede {
  nombre: string
  direccion: string | null
  ciudad: string | null
  activo: boolean
}

export async function listarSedes(): Promise<Sede[]> {
  const { data } = await api.get<Sede[]>('/sedes')
  return data
}

export async function crearSede(payload: DatosSede): Promise<Sede> {
  const { data } = await api.post<Sede>('/sedes', payload)
  return data
}

export async function actualizarSede(id: number, payload: DatosSede): Promise<Sede> {
  const { data } = await api.put<Sede>(`/sedes/${id}`, payload)
  return data
}

export async function eliminarSede(id: number): Promise<void> {
  await api.delete(`/sedes/${id}`)
}
