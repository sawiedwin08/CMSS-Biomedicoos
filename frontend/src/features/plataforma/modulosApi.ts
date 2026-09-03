import type { Modulo } from '../../entities/modulo'
import { api } from '../../shared/api/client'

/** Módulos a los que el usuario logueado tiene acceso (para el lanzador). */
export async function misModulos(): Promise<Modulo[]> {
  const { data } = await api.get<Modulo[]>('/mis-modulos')
  return data
}

/** Todos los módulos (administración). */
export async function listarModulos(): Promise<Modulo[]> {
  const { data } = await api.get<Modulo[]>('/modulos')
  return data
}

/** Módulos asignados actualmente a un rol. */
export async function modulosDeRol(rolId: number): Promise<Modulo[]> {
  const { data } = await api.get<Modulo[]>(`/roles/${rolId}/modulos`)
  return data
}

/** Establece los módulos a los que accede un rol. */
export async function establecerModulosRol(
  rolId: number,
  moduloIds: number[],
): Promise<void> {
  await api.put(`/roles/${rolId}/modulos`, { modulo_ids: moduloIds })
}
