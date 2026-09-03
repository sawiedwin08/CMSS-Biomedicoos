import { Navigate, Route, Routes } from 'react-router-dom'

import { DashboardPage } from '../../features/dashboard/DashboardPage'
import { EquiposPage } from '../../features/inventario/EquiposPage'
import { InventarioPage } from '../../features/inventario/InventarioPage'
import { ProveedoresPage } from '../../features/inventario/ProveedoresPage'
import { SedesPage } from '../../features/inventario/SedesPage'
import { ServiciosPage } from '../../features/inventario/ServiciosPage'
import { useAuth } from '../../shared/auth/AuthContext'
import { ModuleShell, type NavItem } from '../ModuleShell'

const BASE = '/m/biomedicos'

export function BiomedicosModule() {
  const { usuario, puede } = useAuth()
  if (!usuario?.modulos.includes('biomedicos')) {
    return <Navigate to="/" replace />
  }

  const verInv = puede('inventario:ver')
  const items: NavItem[] = [
    { to: '', icono: '🏠', texto: 'Inicio', visible: true },
    { to: 'inventario', icono: '🗂️', texto: 'Inventario', visible: verInv },
    { to: 'equipos', icono: '🩻', texto: 'Equipos', visible: verInv },
    { to: 'sedes', icono: '🏢', texto: 'Sedes', visible: verInv },
    { to: 'servicios', icono: '🏬', texto: 'Servicios', visible: verInv },
    { to: 'proveedores', icono: '🚚', texto: 'Proveedores', visible: verInv },
  ]

  return (
    <ModuleShell
      moduloNombre="Equipos Biomédicos"
      moduloIcono="🩺"
      basePath={BASE}
      items={items}
    >
      <Routes>
        <Route path="" element={<DashboardPage />} />
        {verInv && <Route path="inventario" element={<InventarioPage />} />}
        {verInv && <Route path="equipos" element={<EquiposPage />} />}
        {verInv && <Route path="sedes" element={<SedesPage />} />}
        {verInv && <Route path="servicios" element={<ServiciosPage />} />}
        {verInv && <Route path="proveedores" element={<ProveedoresPage />} />}
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </ModuleShell>
  )
}
