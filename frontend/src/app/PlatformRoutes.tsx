import { Navigate, Route, Routes } from 'react-router-dom'

import { LauncherPage } from '../features/plataforma/LauncherPage'
import { AdminModule } from './modules/AdminModule'
import { BiomedicosModule } from './modules/BiomedicosModule'

/** Rutas de la plataforma: lanzador de módulos + cada módulo bajo /m/<slug>. */
export function PlatformRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LauncherPage />} />
      <Route path="/m/biomedicos/*" element={<BiomedicosModule />} />
      <Route path="/m/admin/*" element={<AdminModule />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
