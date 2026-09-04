import type { Usuario } from '../../entities/usuario'
import { api } from '../../shared/api/client'

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get<Usuario[]>('/usuarios')
  return data
}

export async function crearUsuario(payload: {
  nombre: string
  email: string
  password: string
  rol_id: number
}): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/usuarios', payload)
  return data
}

export async function asignarRol(
  usuarioId: number,
  rolId: number,
): Promise<Usuario> {
  const { data } = await api.put<Usuario>(`/usuarios/${usuarioId}/rol`, {
    rol_id: rolId,
  })
  return data
}

export async function actualizarUsuario(
  usuarioId: number,
  payload: {
    nombre: string
    email: string
    rol_id: number
    activo: boolean
    es_protegido?: boolean
  },
): Promise<Usuario> {
  const { data } = await api.put<Usuario>(`/usuarios/${usuarioId}`, payload)
  return data
}

/** Restablece la contraseña de un usuario (acción de administrador). */
export async function restablecerPassword(
  usuarioId: number,
  password: string,
): Promise<void> {
  await api.put(`/usuarios/${usuarioId}/password`, { password })
}
