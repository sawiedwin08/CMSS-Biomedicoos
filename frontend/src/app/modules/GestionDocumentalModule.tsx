import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from '../../shared/auth/AuthContext'
import { ModuleShell } from '../ModuleShell'

const BASE = '/m/documentos'

export function GestionDocumentalModule() {
  const { usuario } = useAuth()
  if (!usuario?.modulos.includes('documentos')) {
    return <Navigate to="/" replace />
  }

  return (
    <ModuleShell moduloNombre="Gestión Documental" moduloIcono="📄" basePath={BASE} items={[]}>
      <div className="card">
        <h2>Módulo en Construcción</h2>
        <p className="muted">Este módulo está en desarrollo y próximamente estará disponible.</p>
      </div>
    </ModuleShell>
  )
}
