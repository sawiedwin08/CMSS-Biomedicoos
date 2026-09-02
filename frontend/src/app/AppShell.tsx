import { NavLink, Route, Routes } from 'react-router-dom'

import { DashboardPage } from '../features/dashboard/DashboardPage'
import { EquiposPage } from '../features/inventario/EquiposPage'
import { InventarioPage } from '../features/inventario/InventarioPage'
import { ProveedoresPage } from '../features/inventario/ProveedoresPage'
import { SedesPage } from '../features/inventario/SedesPage'
import { ServiciosPage } from '../features/inventario/ServiciosPage'
import { RolesPage } from '../features/roles/RolesPage'
import { UsuariosPage } from '../features/usuarios/UsuariosPage'
import { useAuth } from '../shared/auth/AuthContext'
import { titulo } from '../shared/format'

interface ItemMenu {
  to: string
  icono: string
  texto: string
  visible: boolean
}

export function AppShell() {
  const { usuario, logout, puede } = useAuth()
  if (!usuario) return null

  const items: ItemMenu[] = [
    { to: '/', icono: '🏠', texto: 'Inicio', visible: true },
    { to: '/inventario', icono: '🗂️', texto: 'Inventario', visible: puede('inventario:ver') },
    { to: '/equipos', icono: '🩻', texto: 'Equipos', visible: puede('inventario:ver') },
    { to: '/sedes', icono: '🏢', texto: 'Sedes', visible: puede('inventario:ver') },
    { to: '/servicios', icono: '🏬', texto: 'Servicios', visible: puede('inventario:ver') },
    { to: '/proveedores', icono: '🚚', texto: 'Proveedores', visible: puede('inventario:ver') },
    { to: '/usuarios', icono: '👥', texto: 'Usuarios', visible: puede('usuarios:ver') },
    { to: '/roles', icono: '🔐', texto: 'Roles y permisos', visible: puede('roles:ver') },
  ]

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🩺</span>
          <span>CMSS-Biomédico</span>
        </div>
        <nav className="sidebar-nav">
          {items
            .filter((i) => i.visible)
            .map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                end={i.to === '/'}
                className={({ isActive }) =>
                  isActive ? 'nav-item activo' : 'nav-item'
                }
              >
                <span className="nav-ico">{i.icono}</span>
                <span>{i.texto}</span>
              </NavLink>
            ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            Bienvenido a <strong>CMSS-Biomédico</strong>
          </div>
          <div className="topbar-right">
            <span className="badge">{titulo(usuario.rol_nombre)}</span>
            <span className="muted">{usuario.nombre}</span>
            <button className="btn-ghost" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            {puede('inventario:ver') && (
              <Route path="/inventario" element={<InventarioPage />} />
            )}
            {puede('inventario:ver') && (
              <Route path="/equipos" element={<EquiposPage />} />
            )}
            {puede('inventario:ver') && (
              <Route path="/sedes" element={<SedesPage />} />
            )}
            {puede('inventario:ver') && (
              <Route path="/servicios" element={<ServiciosPage />} />
            )}
            {puede('inventario:ver') && (
              <Route path="/proveedores" element={<ProveedoresPage />} />
            )}
            {puede('usuarios:ver') && (
              <Route path="/usuarios" element={<UsuariosPage />} />
            )}
            {puede('roles:ver') && <Route path="/roles" element={<RolesPage />} />}
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
