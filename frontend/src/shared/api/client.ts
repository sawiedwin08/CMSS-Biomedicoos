import axios from 'axios'

import { clearToken, getToken } from '../auth/tokenStorage'

export const api = axios.create({
  // En producción (frontend servido por el backend) usa el mismo origen con ruta relativa.
  // En desarrollo, el proxy de Vite reenvía /api → el backend.
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
})

// Adjunta el token JWT (si existe) a cada solicitud.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el backend responde 401 (token vencido/ inválido), limpia la sesión y redirige al login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
