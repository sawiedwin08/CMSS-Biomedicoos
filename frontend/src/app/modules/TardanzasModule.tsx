import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from '../../shared/auth/AuthContext'
import { ModuleShell } from '../ModuleShell'

const BASE = '/m/tardanzas'

export function TardanzasModule() {
  const { usuario } = useAuth()
  if (!usuario?.modulos.includes('tardanzas')) {
    return <Navigate to="/" replace />
  }

  return (
    <ModuleShell moduloNombre="Asistencia y Tardanzas" moduloIcono="⏰" basePath={BASE} items={[]}>
      <div className="card">
        <h2>Módulo en Construcción</h2>
        <p className="muted">Este módulo está en desarrollo y próximamente estará disponible.</p>
      </div>
    </ModuleShell>
  )
}
