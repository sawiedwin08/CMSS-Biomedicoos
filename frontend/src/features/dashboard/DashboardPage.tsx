import { useAuth } from '../../shared/auth/AuthContext'
import { titulo } from '../../shared/format'

export function DashboardPage() {
  const { usuario } = useAuth()
  if (!usuario) return null

  return (
    <div className="stack">
      <div className="card">
        <h2>Bienvenido, {usuario.nombre} 👋</h2>
        <p className="muted">Datos de tu sesión (GET /usuarios/me):</p>
        <dl className="datos">
          <dt>Correo</dt>
          <dd>{usuario.email}</dd>
          <dt>Rol</dt>
          <dd>{titulo(usuario.rol_nombre)}</dd>
          <dt>Permisos</dt>
          <dd>{usuario.permisos.length}</dd>
          <dt>Estado</dt>
          <dd>{usuario.activo ? 'Activo' : 'Inactivo'}</dd>
        </dl>
      </div>

      <div className="card">
        <h3>Tus permisos</h3>
        <div className="chips">
          {usuario.permisos.length === 0 && (
            <span className="muted">Sin permisos asignados.</span>
          )}
          {usuario.permisos.map((p) => (
            <span key={p} className="chip">
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
