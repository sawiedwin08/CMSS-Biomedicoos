import { LoginPage } from '../features/auth/LoginPage'
import { useAuth } from '../shared/auth/AuthContext'
import { PlatformRoutes } from './PlatformRoutes'

export function App() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return <div className="centro muted">Cargando…</div>
  }

  return usuario ? <PlatformRoutes /> : <LoginPage />
}
