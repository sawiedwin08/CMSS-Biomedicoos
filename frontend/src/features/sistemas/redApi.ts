import { api } from '../../shared/api/client'

export interface Enlace {
  id: number
  proveedor: string
  sede_id: number | null
  sede_nombre: string | null
  tipo: string | null
  ancho_bajada: string | null
  ancho_subida: string | null
  ip_publica: string | null
  contacto: string | null
  telefono: string | null
  costo: string | null
  estado: string
  observaciones: string | null
}

export type DatosEnlace = Omit<Enlace, 'id' | 'sede_nombre'>

export interface IpEnUso {
  ip: string
  origen: string
  referencia: string
  sede: string | null
  duplicada: boolean
}

export async function listarEnlaces(): Promise<Enlace[]> {
  const { data } = await api.get<Enlace[]>('/sistemas/red/enlaces')
  return data
}

export async function crearEnlace(payload: DatosEnlace): Promise<Enlace> {
  const { data } = await api.post<Enlace>('/sistemas/red/enlaces', payload)
  return data
}

export async function actualizarEnlace(id: number, payload: DatosEnlace): Promise<Enlace> {
  const { data } = await api.put<Enlace>(`/sistemas/red/enlaces/${id}`, payload)
  return data
}

export async function eliminarEnlace(id: number): Promise<void> {
  await api.delete(`/sistemas/red/enlaces/${id}`)
}

export async function listarIps(): Promise<IpEnUso[]> {
  const { data } = await api.get<IpEnUso[]>('/sistemas/red/ips')
  return data
}
