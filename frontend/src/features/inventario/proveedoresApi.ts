import type { Proveedor } from '../../entities/proveedor'
import { api } from '../../shared/api/client'

export interface DatosProveedor {
  nombre: string
  nit: string | null
  contacto: string | null
  telefono: string | null
  email: string | null
  activo: boolean
}

export async function listarProveedores(): Promise<Proveedor[]> {
  const { data } = await api.get<Proveedor[]>('/proveedores')
  return data
}

export async function crearProveedor(payload: DatosProveedor): Promise<Proveedor> {
  const { data } = await api.post<Proveedor>('/proveedores', payload)
  return data
}

export async function actualizarProveedor(
  id: number,
  payload: DatosProveedor,
): Promise<Proveedor> {
  const { data } = await api.put<Proveedor>(`/proveedores/${id}`, payload)
  return data
}

export async function eliminarProveedor(id: number): Promise<void> {
  await api.delete(`/proveedores/${id}`)
}
