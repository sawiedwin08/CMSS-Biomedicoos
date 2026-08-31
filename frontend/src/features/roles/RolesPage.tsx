import { type FormEvent, useEffect, useMemo, useState } from 'react'

import type { Permiso, Rol } from '../../entities/rol'
import { useAuth } from '../../shared/auth/AuthContext'
import { titulo } from '../../shared/format'
import {
  actualizarPermisos,
  crearRol,
  eliminarRol,
  listarPermisos,
  listarRoles,
} from './rolesApi'

export function RolesPage() {
  const { puede } = useAuth()
  const puedeEditar = puede('roles:editar')
  const puedeCrear = puede('roles:crear')
  const puedeEliminar = puede('roles:eliminar')

  const [roles, setRoles] = useState<Rol[]>([])
  const [permisos, setPermisos] = useState<Permiso[]>([])
  const [selId, setSelId] = useState<number | null>(null)
  const [marcados, setMarcados] = useState<Set<number>>(new Set())
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rolSel = roles.find((r) => r.id === selId) ?? null

  const modulos = useMemo(() => {
    const map = new Map<string, Permiso[]>()
    for (const p of permisos) {
      const arr = map.get(p.modulo) ?? []
      arr.push(p)
      map.set(p.modulo, arr)
    }
    return [...map.entries()]
  }, [permisos])

  async function recargar(seleccionar?: number) {
    const [rs, ps] = await Promise.all([listarRoles(), listarPermisos()])
    setRoles(rs)
    setPermisos(ps)
    const id = seleccionar ?? selId ?? rs[0]?.id ?? null
    seleccionarRol(id, rs)
  }

  function seleccionarRol(id: number | null, fuente: Rol[] = roles) {
    setSelId(id)
    setMensaje(null)
    setError(null)
    const rol = fuente.find((r) => r.id === id)
    setMarcados(new Set(rol?.permisos.map((p) => p.id) ?? []))
  }

  useEffect(() => {
    recargar()
      .catch(() => setError('No se pudieron cargar los roles.'))
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggle(permisoId: number) {
    setMarcados((prev) => {
      const next = new Set(prev)
      if (next.has(permisoId)) next.delete(permisoId)
      else next.add(permisoId)
      return next
    })
  }

  async function guardar() {
    if (!rolSel) return
    setGuardando(true)
    setError(null)
    setMensaje(null)
    try {
      const actualizado = await actualizarPermisos(rolSel.id, [...marcados])
      setRoles((rs) => rs.map((r) => (r.id === actualizado.id ? actualizado : r)))
      setMensaje('Permisos guardados correctamente.')
    } catch {
      setError('No se pudieron guardar los permisos.')
    } finally {
      setGuardando(false)
    }
  }

  async function borrar(rol: Rol) {
    if (!window.confirm(`¿Eliminar el rol "${rol.nombre}"?`)) return
    try {
      await eliminarRol(rol.id)
      await recargar(roles.find((r) => r.id !== rol.id)?.id)
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response
        ?.data?.detail
      setError(detail ?? 'No se pudo eliminar el rol.')
    }
  }

  if (cargando) return <div className="muted">Cargando roles…</div>

  return (
    <div className="roles-layout">
      <aside className="roles-list card">
        <div className="roles-list-head">
          <h3>Roles</h3>
        </div>
        <ul>
          {roles.map((r) => (
            <li
              key={r.id}
              className={r.id === selId ? 'rol-item activo' : 'rol-item'}
              onClick={() => seleccionarRol(r.id)}
            >
              <div>
                <strong>{titulo(r.nombre)}</strong>
                {r.es_sistema && <span className="badge-mini">sistema</span>}
                <div className="muted small">{r.permisos.length} permisos</div>
              </div>
              {!r.es_sistema && puedeEliminar && (
                <button
                  className="link-danger"
                  onClick={(e) => {
                    e.stopPropagation()
                    borrar(r)
                  }}
                  title="Eliminar rol"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>

        {puedeCrear && <NuevoRolForm onCreado={(id) => recargar(id)} onError={setError} />}
      </aside>

      <section className="roles-detail card">
        {!rolSel ? (
          <p className="muted">Selecciona un rol para ver sus permisos.</p>
        ) : (
          <>
            <div className="detail-head">
              <div>
                <h2>{titulo(rolSel.nombre)}</h2>
                <p className="muted">{rolSel.descripcion || 'Sin descripción'}</p>
              </div>
              {puedeEditar && (
                <button
                  className="btn-primary"
                  onClick={guardar}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando…' : 'Guardar permisos'}
                </button>
              )}
            </div>

            {mensaje && <div className="alert-ok">{mensaje}</div>}
            {error && <div className="alert-error">{error}</div>}

            <div className="matriz">
              {modulos.map(([modulo, perms]) => (
                <fieldset key={modulo} className="modulo-grupo">
                  <legend>{titulo(modulo)}</legend>
                  {perms.map((p) => (
                    <label key={p.id} className="perm-check" title={p.descripcion ?? ''}>
                      <input
                        type="checkbox"
                        checked={marcados.has(p.id)}
                        disabled={!puedeEditar}
                        onChange={() => toggle(p.id)}
                      />
                      <span>{titulo(p.accion)}</span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function NuevoRolForm({
  onCreado,
  onError,
}: {
  onCreado: (id: number) => void
  onError: (msg: string) => void
}) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    try {
      const rol = await crearRol({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        permiso_ids: [],
      })
      setNombre('')
      setDescripcion('')
      onCreado(rol.id)
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response
        ?.data?.detail
      onError(detail ?? 'No se pudo crear el rol.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="nuevo-rol" onSubmit={onSubmit}>
      <h4>Nuevo rol</h4>
      <input
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
        minLength={2}
      />
      <input
        placeholder="Descripción (opcional)"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />
      <button className="btn-ghost" type="submit" disabled={enviando}>
        {enviando ? 'Creando…' : 'Crear rol'}
      </button>
    </form>
  )
}
