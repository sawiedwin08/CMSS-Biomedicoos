import { Navigate, Route, Routes } from 'react-router-dom'

import { LauncherPage } from '../features/plataforma/LauncherPage'
import { AdminModule } from './modules/AdminModule'
import { BiomedicosModule } from './modules/BiomedicosModule'
import { ContenidosModule } from './modules/ContenidosModule'
import { GestionDocumentalModule } from './modules/GestionDocumentalModule'
import { GestionHumanaModule } from './modules/GestionHumanaModule'
import { InventarioTecnologicoModule } from './modules/InventarioTecnologicoModule'
import { TardanzasModule } from './modules/TardanzasModule'

export function PlatformRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LauncherPage />} />
      <Route path="/m/biomedicos/*" element={<BiomedicosModule />} />
      <Route path="/m/tardanzas/*" element={<TardanzasModule />} />
      <Route path="/m/admin/*" element={<AdminModule />} />
      <Route path="/m/documentos/*" element={<GestionDocumentalModule />} />
      <Route path="/m/contenidos/*" element={<ContenidosModule />} />
      <Route path="/m/inventario_tecnologico/*" element={<InventarioTecnologicoModule />} />
      <Route path="/m/gestion_humana/*" element={<GestionHumanaModule />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
