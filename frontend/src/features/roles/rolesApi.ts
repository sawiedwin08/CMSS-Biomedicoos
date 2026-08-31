import type { Permiso, Rol } from '../../entities/rol'
import { api } from '../../shared/api/client'

export async function listarRoles(): Promise<Rol[]> {
  const { data } = await api.get<Rol[]>('/roles')
  return data
}

export async function listarPermisos(): Promise<Permiso[]> {
  const { data } = await api.get<Permiso[]>('/permisos')
  return data
}

export async function crearRol(payload: {
  nombre: string
  descripcion: string | null
  permiso_ids: number[]
}): Promise<Rol> {
  const { data } = await api.post<Rol>('/roles', payload)
  return data
}

export async function actualizarPermisos(
  rolId: number,
  permisoIds: number[],
): Promise<Rol> {
  const { data } = await api.put<Rol>(`/roles/${rolId}/permisos`, {
    permiso_ids: permisoIds,
  })
  return data
}

export async function eliminarRol(rolId: number): Promise<void> {
  await api.delete(`/roles/${rolId}`)
}
