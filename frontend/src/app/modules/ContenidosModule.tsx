import { Navigate } from 'react-router-dom'

import { useAuth } from '../../shared/auth/AuthContext'
import { ModuleShell } from '../ModuleShell'

const BASE = '/m/contenidos'

export function ContenidosModule() {
  const { usuario } = useAuth()
  if (!usuario?.modulos.includes('contenidos')) {
    return <Navigate to="/" replace />
  }

  return (
    <ModuleShell moduloNombre="Gestión de Contenidos" moduloIcono="📝" basePath={BASE} items={[]}>
      <div className="card">
        <h2>Módulo en Construcción</h2>
        <p className="muted">Este módulo está en desarrollo y próximamente estará disponible.</p>
      </div>
    </ModuleShell>
  )
}
