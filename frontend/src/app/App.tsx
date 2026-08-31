import { LoginPage } from '../features/auth/LoginPage'
import { useAuth } from '../shared/auth/AuthContext'
import { AppShell } from './AppShell'

export function App() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return <div className="centro muted">Cargando…</div>
  }

  return usuario ? <AppShell /> : <LoginPage />
}
