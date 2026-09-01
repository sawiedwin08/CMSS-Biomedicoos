import { type FormEvent, useEffect, useState } from 'react'

import type { Rol } from '../../entities/rol'
import type { Usuario } from '../../entities/usuario'
import { useAuth } from '../../shared/auth/AuthContext'
import { titulo } from '../../shared/format'
import { type Columna, DataTable } from '../../shared/ui/DataTable'
import { listarRoles } from '../roles/rolesApi'
import { actualizarUsuario, crearUsuario, listarUsuarios } from './usuariosApi'

function detalleError(err: unknown, porDefecto: string): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    porDefecto
  )
}

export function UsuariosPage() {
  const { usuario: yo, puede } = useAuth()
  const puedeCrear = puede('usuarios:crear')
  const puedeEditar = puede('usuarios:editar')
  const puedeProteger = puede('usuarios:proteger')
  const puedeVerRoles = puede('roles:ver')

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [editando, setEditando] = useState<Usuario | null>(null)

  const hayRoles = puedeVerRoles && roles.length > 0

  async function cargarUsuarios() {
    setUsuarios(await listarUsuarios())
  }

  async function cargarRoles() {
    if (!puedeVerRoles) return
    try {
      setRoles(await listarRoles())
    } catch {
      /* sin permiso para ver roles */
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        await cargarUsuarios()
      } catch (err) {
        setError(detalleError(err, 'No se pudieron cargar los usuarios.'))
        return
      } finally {
        setCargando(false)
      }
      await cargarRoles()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Un usuario es editable si tengo el permiso y no está protegido por otro.
  function editable(u: Usuario): boolean {
    if (!puedeEditar) return false
    if (u.es_protegido && u.id !== yo?.id) return false
    return true
  }

  if (cargando) return <div className="muted">Cargando usuarios…</div>

  const columnas: Columna<Usuario>[] = [
    {
      header: 'Nombre',
      celda: (u) => (
        <>
          {u.es_protegido && <span title="Usuario protegido">🔒 </span>}
          {u.nombre}
          {yo?.id === u.id && <span className="muted small"> (tú)</span>}
        </>
      ),
    },
    { header: 'Correo', celda: (u) => u.email },
    {
      header: 'Rol',
      celda: (u) => <span className="badge">{titulo(u.rol_nombre)}</span>,
    },
    {
      header: 'Estado',
      celda: (u) => (
        <span className={u.activo ? 'estado-ok' : 'estado-off'}>
          {u.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: '',
      ancho: 60,
      celda: (u) =>
        editable(u) && hayRoles ? (
          <button
            className="icon-btn"
            title="Editar usuario"
            onClick={() => {
              setError(null)
              setMensaje(null)
              setEditando(u)
            }}
          >
            ✏️
          </button>
        ) : u.es_protegido && u.id !== yo?.id ? (
          <span className="muted" title="Protegido: no editable">
            🔒
          </span>
        ) : null,
    },
  ]

  return (
    <div className="stack">
      {puedeCrear &&
        (hayRoles ? (
          <NuevoUsuarioForm
            roles={roles}
            onCreado={async () => {
              await cargarUsuarios()
              setMensaje('Usuario creado correctamente.')
            }}
            onError={setError}
          />
        ) : (
          <div className="card aviso">
            Para <strong>crear usuarios</strong> y asignarles rol necesitas también
            el permiso <code>roles:ver</code>.
          </div>
        ))}

      <div className="card">
        <h2>Usuarios</h2>
        {mensaje && <div className="alert-ok">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}

        <DataTable
          columnas={columnas}
          filas={usuarios}
          keyOf={(u) => u.id}
          porPagina={15}
          vacio="No hay usuarios."
        />

        {puedeEditar && !hayRoles && (
          <p className="muted small" style={{ marginTop: 12 }}>
            Para editar usuarios necesitas también el permiso <code>roles:ver</code>.
          </p>
        )}
      </div>

      {editando && (
        <EditarUsuarioModal
          usuario={editando}
          roles={roles}
          puedeProteger={puedeProteger}
          onCerrar={() => setEditando(null)}
          onGuardado={async (u) => {
            setEditando(null)
            await cargarUsuarios()
            setMensaje(`Usuario "${u.nombre}" actualizado.`)
          }}
          onError={setError}
        />
      )}
    </div>
  )
}

function EditarUsuarioModal({
  usuario,
  roles,
  puedeProteger,
  onCerrar,
  onGuardado,
  onError,
}: {
  usuario: Usuario
  roles: Rol[]
  puedeProteger: boolean
  onCerrar: () => void
  onGuardado: (u: Usuario) => void | Promise<void>
  onError: (msg: string) => void
}) {
  const [nombre, setNombre] = useState(usuario.nombre)
  const [email, setEmail] = useState(usuario.email)
  const [rolId, setRolId] = useState(usuario.rol_id)
  const [activo, setActivo] = useState(usuario.activo)
  const [protegido, setProtegido] = useState(usuario.es_protegido)
  const [guardando, setGuardando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      const actualizado = await actualizarUsuario(usuario.id, {
        nombre,
        email,
        rol_id: rolId,
        activo,
        ...(puedeProteger ? { es_protegido: protegido } : {}),
      })
      await onGuardado(actualizado)
    } catch (err) {
      onError(detalleError(err, 'No se pudo actualizar el usuario.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <form
        className="modal card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
      >
        <h3>Editar usuario</h3>
        <label className="field">
          <span>Nombre</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
        </label>
        <label className="field">
          <span>Correo</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Rol</span>
          <select value={rolId} onChange={(e) => setRolId(Number(e.target.value))}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {titulo(r.nombre)}
              </option>
            ))}
          </select>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          <span>Usuario activo</span>
        </label>
        {puedeProteger && (
          <label className="check-row">
            <input
              type="checkbox"
              checked={protegido}
              onChange={(e) => setProtegido(e.target.checked)}
            />
            <span>🔒 Usuario protegido (solo él mismo puede editarlo)</span>
          </label>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

function NuevoUsuarioForm({
  roles,
  onCreado,
  onError,
}: {
  roles: Rol[]
  onCreado: () => void | Promise<void>
  onError: (msg: string) => void
}) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rolId, setRolId] = useState<number | ''>('')
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (rolId === '') {
      onError('Selecciona un rol.')
      return
    }
    setEnviando(true)
    try {
      await crearUsuario({ nombre, email, password, rol_id: Number(rolId) })
      setNombre('')
      setEmail('')
      setPassword('')
      setRolId('')
      await onCreado()
    } catch (err) {
      onError(detalleError(err, 'No se pudo crear el usuario.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="card form-inline" onSubmit={onSubmit}>
      <h3>Nuevo usuario</h3>
      <div className="form-grid">
        <label className="field">
          <span>Nombre</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
        </label>
        <label className="field">
          <span>Correo</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="mín. 8 caracteres"
          />
        </label>
        <label className="field">
          <span>Rol</span>
          <select value={rolId} onChange={(e) => setRolId(Number(e.target.value))} required>
            <option value="" disabled>
              Selecciona…
            </option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {titulo(r.nombre)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className="btn-primary" type="submit" disabled={enviando}>
        {enviando ? 'Creando…' : 'Crear usuario'}
      </button>
    </form>
  )
}
