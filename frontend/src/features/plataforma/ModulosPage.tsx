import { useEffect, useState } from 'react'

import type { Modulo } from '../../entities/modulo'
import type { Rol } from '../../entities/rol'
import { useAuth } from '../../shared/auth/AuthContext'
import { titulo } from '../../shared/format'
import { listarRoles } from '../roles/rolesApi'
import {
  establecerModulosRol,
  listarModulos,
  modulosDeRol,
} from './modulosApi'

function detalleError(err: unknown, porDefecto: string): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    porDefecto
  )
}

export function ModulosPage() {
  const { puede } = useAuth()
  const puedeAsignar = puede('modulos:asignar')

  const [roles, setRoles] = useState<Rol[]>([])
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [rolId, setRolId] = useState<number | null>(null)
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set())
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [rs, ms] = await Promise.all([listarRoles(), listarModulos()])
        setRoles(rs)
        setModulos(ms)
        if (rs.length) setRolId(rs[0].id)
      } catch (err) {
        setError(detalleError(err, 'No se pudieron cargar roles/módulos.'))
      } finally {
        setCargando(false)
      }
    })()
  }, [])

  // Al cambiar de rol, carga sus módulos asignados.
  useEffect(() => {
    if (rolId == null) return
    setMensaje(null)
    setError(null)
    modulosDeRol(rolId)
      .then((asignados) => setSeleccion(new Set(asignados.map((m) => m.id))))
      .catch((err) => setError(detalleError(err, 'No se pudieron cargar los módulos del rol.')))
  }, [rolId])

  function alternar(id: number) {
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function guardar() {
    if (rolId == null) return
    setGuardando(true)
    setError(null)
    setMensaje(null)
    try {
      await establecerModulosRol(rolId, [...seleccion])
      setMensaje('Acceso a módulos actualizado.')
    } catch (err) {
      setError(detalleError(err, 'No se pudo guardar.'))
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="muted">Cargando…</div>

  return (
    <div className="stack">
      <div className="card">
        <div className="detail-head">
          <h2>Módulos por rol</h2>
        </div>
        <p className="muted small">
          Define a qué módulos de la plataforma puede ingresar cada rol.
        </p>

        <label className="field" style={{ maxWidth: 320 }}>
          <span>Rol</span>
          <select
            value={rolId ?? ''}
            onChange={(e) => setRolId(e.target.value ? Number(e.target.value) : null)}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {titulo(r.nombre)}
              </option>
            ))}
          </select>
        </label>

        {mensaje && <div className="alert-ok">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}

        <div className="modulos-lista">
          {modulos.map((m) => (
            <label key={m.id} className={`modulo-check${m.activo ? '' : ' inactivo'}`}>
              <input
                type="checkbox"
                checked={seleccion.has(m.id)}
                onChange={() => alternar(m.id)}
                disabled={!puedeAsignar}
              />
              <span className="modulo-ico-sm">{m.icono ?? '📦'}</span>
              <span>
                <strong>{m.nombre}</strong>
                {m.descripcion && <span className="muted small"> — {m.descripcion}</span>}
                {!m.activo && <span className="muted small"> (inactivo)</span>}
              </span>
            </label>
          ))}
        </div>

        {puedeAsignar && (
          <div className="modal-actions">
            <button className="btn-primary" disabled={guardando} onClick={guardar}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
