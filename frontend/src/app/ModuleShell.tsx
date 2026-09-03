import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { useAuth } from '../shared/auth/AuthContext'
import { titulo } from '../shared/format'

export interface NavItem {
  to: string
  icono: string
  texto: string
  visible: boolean
}

/** Cascarón (sidebar + topbar) reutilizable para cada módulo de la plataforma. */
export function ModuleShell({
  moduloNombre,
  moduloIcono,
  basePath,
  items,
  children,
}: {
  moduloNombre: string
  moduloIcono: string
  basePath: string
  items: NavItem[]
  children: ReactNode
}) {
  const { usuario, logout } = useAuth()
  if (!usuario) return null

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">{moduloIcono}</span>
          <span>{moduloNombre}</span>
        </div>

        <NavLink to="/" className="nav-item volver">
          <span className="nav-ico">←</span>
          <span>Módulos</span>
        </NavLink>

        <nav className="sidebar-nav">
          {items
            .filter((i) => i.visible)
            .map((i) => (
              <NavLink
                key={i.to}
                to={i.to ? `${basePath}/${i.to}` : basePath}
                end={i.to === ''}
                className={({ isActive }) => (isActive ? 'nav-item activo' : 'nav-item')}
              >
                <span className="nav-ico">{i.icono}</span>
                <span>{i.texto}</span>
              </NavLink>
            ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">{moduloNombre}</div>
          <div className="topbar-right">
            <span className="badge">{titulo(usuario.rol_nombre)}</span>
            <span className="muted">{usuario.nombre}</span>
            <button className="btn-ghost" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  )
}
