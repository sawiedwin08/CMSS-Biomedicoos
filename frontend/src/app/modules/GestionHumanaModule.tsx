import { Navigate } from 'react-router-dom'

import { useAuth } from '../../shared/auth/AuthContext'
import { ModuleShell } from '../ModuleShell'

const BASE = '/m/gestion_humana'

export function GestionHumanaModule() {
  const { usuario } = useAuth()
  if (!usuario?.modulos.includes('gestion_humana')) {
    return <Navigate to="/" replace />
  }

  return (
    <ModuleShell moduloNombre="Gestión Humana" moduloIcono="👥" basePath={BASE} items={[]}>
      <div className="card">
        <h2>Módulo en Construcción</h2>
        <p className="muted">Este módulo está en desarrollo y próximamente estará disponible.</p>
      </div>
    </ModuleShell>
  )
}
