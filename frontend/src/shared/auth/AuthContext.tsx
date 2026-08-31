import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import type { Usuario } from '../../entities/usuario'
import { fetchMe, login as loginApi } from './authApi'
import { clearToken, getToken, setToken } from './tokenStorage'

interface AuthState {
  usuario: Usuario | null
  cargando: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  puede: (codigo: string) => boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  // Al montar: si hay token guardado, intenta recuperar la sesión.
  useEffect(() => {
    if (!getToken()) {
      setCargando(false)
      return
    }
    fetchMe()
      .then(setUsuario)
      .catch(() => clearToken())
      .finally(() => setCargando(false))
  }, [])

  async function login(email: string, password: string) {
    const token = await loginApi(email, password)
    setToken(token)
    setUsuario(await fetchMe())
  }

  function logout() {
    clearToken()
    setUsuario(null)
  }

  function puede(codigo: string): boolean {
    return usuario?.permisos.includes(codigo) ?? false
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, puede }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}
