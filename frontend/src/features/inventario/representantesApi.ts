import type { Representante } from '../../entities/representante'
import { api } from '../../shared/api/client'

export interface DatosRepresentante {
  nombre: string
  pais: string | null
  ciudad: string | null
  direccion: string | null
  telefono: string | null
  correo: string | null
  activo: boolean
}

export async function listarRepresentantes(): Promise<Representante[]> {
  const { data } = await api.get<Representante[]>('/representantes')
  return data
}

export async function crearRepresentante(
  payload: DatosRepresentante,
): Promise<Representante> {
  const { data } = await api.post<Representante>('/representantes', payload)
  return data
}

export async function actualizarRepresentante(
  id: number,
  payload: DatosRepresentante,
): Promise<Representante> {
  const { data } = await api.put<Representante>(`/representantes/${id}`, payload)
  return data
}

export async function eliminarRepresentante(id: number): Promise<void> {
  await api.delete(`/representantes/${id}`)
}
