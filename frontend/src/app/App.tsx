import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { LoginPage } from '../features/auth/LoginPage'
import { SeguimientoPage } from '../features/sistemas/SeguimientoPage'
import { SoportePage } from '../features/sistemas/SoportePage'
import { useAuth } from '../shared/auth/AuthContext'
import { PlatformRoutes } from './PlatformRoutes'

export function App() {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  // Rutas PÚBLICAS (sin login): mesa de ayuda para quien no tiene cuenta.
  if (location.pathname.startsWith('/soporte')) {
    return (
      <Routes>
        <Route path="/soporte" element={<SoportePage />} />
        <Route path="/soporte/seguimiento" element={<SeguimientoPage />} />
        <Route path="*" element={<Navigate to="/soporte" replace />} />
      </Routes>
    )
  }

  if (cargando) {
    return <div className="centro muted">Cargando…</div>
  }

  return usuario ? <PlatformRoutes /> : <LoginPage />
}
