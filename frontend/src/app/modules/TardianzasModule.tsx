import { Clock, Settings2 } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { DepartamentosPage } from '../../features/tardanzas/DepartamentosPage'
import { HorariosPage } from '../../features/tardanzas/HorariosPage'
import { useAuth } from '../../shared/auth/AuthContext'
import { ModuleShell, type NavItem } from '../ModuleShell'

const BASE = '/m/tardanzas'

export function TardianzasModule() {
  const { usuario, puede } = useAuth()
  if (!usuario?.modulos.includes('tardanzas')) {
    return <Navigate to="/" replace />
  }

  const verDepartamentos = puede('tardanzas:ver')
  const verHorarios = puede('tardanzas:ver')

  const items: NavItem[] = [
    {
      to: 'departamentos',
      icono: Settings2,
      texto: 'Departamentos',
      visible: verDepartamentos,
    },
    { to: 'horarios', icono: Clock, texto: 'Horarios', visible: verHorarios },
  ]

  const inicio = verDepartamentos ? 'departamentos' : verHorarios ? 'horarios' : ''

  return (
    <ModuleShell
      moduloNombre="Tardanzas"
      moduloIcono="⏰"
      basePath={BASE}
      items={items}
    >
      <Routes>
        <Route path="" element={<Navigate to={inicio} replace />} />
        {verDepartamentos && (
          <Route path="departamentos" element={<DepartamentosPage />}
        )}
        {verHorarios && <Route path="horarios" element={<HorariosPage />} />}
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </ModuleShell>
  )
}
