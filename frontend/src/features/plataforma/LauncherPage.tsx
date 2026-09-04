import { Hospital } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import type { Modulo } from '../../entities/modulo'
import { useAuth } from '../../shared/auth/AuthContext'
import { titulo } from '../../shared/format'
import { misModulos } from './modulosApi'

export function LauncherPage() {
  const { usuario, logout } = useAuth()
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    misModulos()
      .then(setModulos)
      .catch(() => setError('No se pudieron cargar los módulos.'))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="launcher">
      <header className="launcher-top">
        <div className="launcher-brand">
          <span className="brand-icon">
            <Hospital size={24} />
          </span>
          <span>Sistema de Gestión CMVA</span>
        </div>
        <div className="topbar-right">
          {usuario && <span className="badge">{titulo(usuario.rol_nombre)}</span>}
          {usuario && <span className="muted">{usuario.nombre}</span>}
          <button className="btn-ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="launcher-body">
        <h1 className="launcher-titulo">Tus módulos</h1>
        <p className="muted">Selecciona el módulo al que deseas ingresar.</p>

        {error && <div className="alert-error">{error}</div>}
        {cargando ? (
          <div className="muted">Cargando módulos…</div>
        ) : modulos.length === 0 ? (
          <div className="aviso" style={{ marginTop: 16 }}>
            No tienes módulos asignados. Contacta al administrador.
          </div>
        ) : (
          <div className="launcher-grid">
            {modulos.map((m) => (
              <Link key={m.slug} to={`/m/${m.slug}`} className="modulo-card">
                <span className="modulo-ico">{m.icono ?? '📦'}</span>
                <h3>{m.nombre}</h3>
                {m.descripcion && <p className="muted">{m.descripcion}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
