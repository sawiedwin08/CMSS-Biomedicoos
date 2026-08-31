import type { Usuario } from '../../entities/usuario'
import { api } from '../api/client'

/** Inicia sesión contra POST /auth/login (OAuth2: campos username/password). */
export async function login(email: string, password: string): Promise<string> {
  const body = new URLSearchParams()
  body.set('username', email)
  body.set('password', password)

  const { data } = await api.post<{ access_token: string; token_type: string }>(
    '/auth/login',
    body,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  )
  return data.access_token
}

/** Obtiene el usuario autenticado (GET /usuarios/me). */
export async function fetchMe(): Promise<Usuario> {
  const { data } = await api.get<Usuario>('/usuarios/me')
  return data
}
