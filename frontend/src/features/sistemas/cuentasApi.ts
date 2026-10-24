import { api } from '../../shared/api/client'

export interface CuentaCorreo {
  id: number
  correo: string
  asignado_a: string | null
  area: string | null
  recuperacion: string | null
  proposito: string | null
  estado: string
  notas: string | null
  created_at: string
}

export interface DatosCuenta {
  correo: string
  contrasena?: string | null
  asignado_a: string | null
  area: string | null
  recuperacion: string | null
  proposito: string | null
  estado: string
  notas: string | null
}

export async function listarCuentas(): Promise<CuentaCorreo[]> {
  const { data } = await api.get<CuentaCorreo[]>('/sistemas/cuentas-correo')
  return data
}

export async function crearCuenta(payload: DatosCuenta): Promise<CuentaCorreo> {
  const { data } = await api.post<CuentaCorreo>('/sistemas/cuentas-correo', payload)
  return data
}

export async function actualizarCuenta(id: number, payload: DatosCuenta): Promise<CuentaCorreo> {
  const { data } = await api.put<CuentaCorreo>(`/sistemas/cuentas-correo/${id}`, payload)
  return data
}

export async function eliminarCuenta(id: number): Promise<void> {
  await api.delete(`/sistemas/cuentas-correo/${id}`)
}

export async function verPassword(id: number): Promise<string> {
  const { data } = await api.get<{ password: string }>(`/sistemas/cuentas-correo/${id}/password`)
  return data.password
}
