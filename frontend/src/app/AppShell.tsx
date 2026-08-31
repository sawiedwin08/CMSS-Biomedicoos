import { NavLink, Route, Routes } from 'react-router-dom'

import { DashboardPage } from '../features/dashboard/DashboardPage'
import { RolesPage } from '../features/roles/RolesPage'
import { UsuariosPage } from '../features/usuarios/UsuariosPage'
import { useAuth } from '../shared/auth/AuthContext'
import { titulo } from '../shared/format'

export function AppShell() {
  const { usuario, logout, puede } = useAuth()
  if (!usuario) return null

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">🩺</span>
          <strong>CMSS-Biomédico</strong>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'activo' : '')}>
            Inicio
          </NavLink>
          {puede('usuarios:ver') && (
            <NavLink
              to="/usuarios"
              className={({ isActive }) => (isActive ? 'activo' : '')}
            >
              Usuarios
            </NavLink>
          )}
          {puede('roles:ver') && (
            <NavLink
              to="/roles"
              className={({ isActive }) => (isActive ? 'activo' : '')}
            >
              Roles y permisos
            </NavLink>
          )}
        </nav>
        <div className="topbar-right">
          <span className="muted">{usuario.nombre}</span>
          <span className="badge">{titulo(usuario.rol_nombre)}</span>
          <button className="btn-ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          {puede('usuarios:ver') && (
            <Route path="/usuarios" element={<UsuariosPage />} />
          )}
          {puede('roles:ver') && <Route path="/roles" element={<RolesPage />} />}
          <Route path="*" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  )
}
