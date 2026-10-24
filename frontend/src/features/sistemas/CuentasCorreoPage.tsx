import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import { useAuth } from '../../shared/auth/AuthContext'
import DataTable, { type Columna } from '../../shared/ui/DataTable'
import { cerrarAlClicFuera } from '../../shared/ui/overlay'
import {
  actualizarCuenta,
  crearCuenta,
  type CuentaCorreo,
  type DatosCuenta,
  eliminarCuenta,
  listarCuentas,
  verPassword,
} from './cuentasApi'

function detalleError(err: unknown, p: string): string {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? p
}

const ESTADOS = ['activa', 'inactiva', 'liberada']

export function CuentasCorreoPage() {
  const { puede } = useAuth()
  const puedeCrear = puede('sistemas:crear')
  const puedeEditar = puede('sistemas:editar')
  const puedeEliminar = puede('sistemas:eliminar')
  const puedeVerClave = puede('sistemas:credenciales')

  const [items, setItems] = useState<CuentaCorreo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<CuentaCorreo | null>(null)
  const [revelada, setRevelada] = useState<Record<number, string>>({})

  async function cargar() {
    setItems(await listarCuentas())
  }

  useEffect(() => {
    cargar()
      .catch((err) => setError(detalleError(err, 'No se pudieron cargar las cuentas.')))
      .finally(() => setCargando(false))
  }, [])

  async function toggleClave(c: CuentaCorreo) {
    if (revelada[c.id] !== undefined) {
      setRevelada((r) => {
        const n = { ...r }
        delete n[c.id]
        return n
      })
      return
    }
    try {
      const pw = await verPassword(c.id)
      setRevelada((r) => ({ ...r, [c.id]: pw }))
    } catch (err) {
      setError(detalleError(err, 'No se pudo revelar la contraseña.'))
    }
  }

  async function borrar(c: CuentaCorreo) {
    if (!window.confirm(`¿Eliminar la cuenta "${c.correo}"?`)) return
    try {
      await eliminarCuenta(c.id)
      await cargar()
      setMensaje('Cuenta eliminada.')
    } catch (err) {
      setError(detalleError(err, 'No se pudo eliminar.'))
    }
  }

  const columnas: Columna<CuentaCorreo>[] = [
    { id: 'correo', header: 'Correo', accessorFn: (c) => c.correo },
    { id: 'asignado', header: 'Asignado a', accessorFn: (c) => c.asignado_a || '—' },
    { id: 'area', header: 'Área', accessorFn: (c) => c.area || '—' },
    { id: 'proposito', header: 'Propósito', accessorFn: (c) => c.proposito || '—' },
    { id: 'estado', header: 'Estado', accessorFn: (c) => c.estado },
    {
      id: 'clave',
      header: 'Contraseña',
      enableSorting: false,
      cell: ({ row }) => {
        const c = row.original
        const pw = revelada[c.id]
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'monospace' }}>{pw !== undefined ? pw : '••••••••'}</span>
            {puedeVerClave && (
              <button
                className="icon-btn"
                title={pw !== undefined ? 'Ocultar' : 'Mostrar'}
                onClick={() => toggleClave(c)}
              >
                {pw !== undefined ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </span>
        )
      },
    },
    {
      id: 'acciones',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const c = row.original
        return (
          <>
            {puedeEditar && (
              <button className="icon-btn" title="Editar" onClick={() => setEditando(c)}>
                <Pencil size={16} />
              </button>
            )}
            {puedeEliminar && (
              <button className="icon-btn" title="Eliminar" onClick={() => borrar(c)}>
                <Trash2 size={16} />
              </button>
            )}
          </>
        )
      },
    },
  ]

  return (
    <div className="stack">
      {puedeCrear && (
        <div className="card">
          <button className="btn-primary" onClick={() => setCreando(true)}>
            + Nueva cuenta
          </button>
        </div>
      )}

      <div className="card">
        {mensaje && <div className="alert-ok">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}
        {!puedeVerClave && (
          <div className="muted" style={{ marginBottom: 8 }}>
            No tienes permiso para ver las contraseñas (solo se muestran ocultas).
          </div>
        )}
        {cargando ? (
          <div className="muted">Cargando…</div>
        ) : (
          <DataTable columns={columnas} data={items} title="Cuentas de correo" initialPageSize={15} />
        )}
      </div>

      {(creando || editando) && (
        <div
          className="modal-overlay"
          onMouseDown={cerrarAlClicFuera(() => {
            setCreando(false)
            setEditando(null)
          })}
        >
          <div className="modal card" onClick={(ev) => ev.stopPropagation()} style={{ maxWidth: 620 }}>
            <CuentaForm
              inicial={editando ?? undefined}
              onGuardar={async (datos) => {
                if (editando) {
                  await actualizarCuenta(editando.id, datos)
                  setMensaje('Cuenta actualizada.')
                } else {
                  await crearCuenta(datos)
                  setMensaje('Cuenta creada.')
                }
                setCreando(false)
                setEditando(null)
                await cargar()
              }}
              onError={setError}
              onCancelar={() => {
                setCreando(false)
                setEditando(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function CuentaForm({
  inicial,
  onGuardar,
  onError,
  onCancelar,
}: {
  inicial?: CuentaCorreo
  onGuardar: (datos: DatosCuenta) => Promise<void>
  onError: (m: string) => void
  onCancelar: () => void
}) {
  const esEdicion = Boolean(inicial)
  const [f, setF] = useState<DatosCuenta>({
    correo: inicial?.correo ?? '',
    contrasena: '',
    asignado_a: inicial?.asignado_a ?? null,
    area: inicial?.area ?? null,
    recuperacion: inicial?.recuperacion ?? null,
    proposito: inicial?.proposito ?? null,
    estado: inicial?.estado ?? 'activa',
    notas: inicial?.notas ?? null,
  })
  const [guardando, setGuardando] = useState(false)

  function set<K extends keyof DatosCuenta>(k: K, v: DatosCuenta[K]) {
    setF((x) => ({ ...x, [k]: v }))
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault()
    setGuardando(true)
    try {
      await onGuardar(f)
    } catch (err) {
      onError(detalleError(err, 'No se pudo guardar la cuenta.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h3>{esEdicion ? 'Editar cuenta' : 'Nueva cuenta'}</h3>
      <div className="form-grid">
        <label className="field">
          <span>Correo *</span>
          <input
            type="email"
            value={f.correo}
            onChange={(e) => set('correo', e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>{esEdicion ? 'Contraseña (vacío = conservar)' : 'Contraseña *'}</span>
          <input
            value={f.contrasena ?? ''}
            onChange={(e) => set('contrasena', e.target.value)}
            required={!esEdicion}
            placeholder={esEdicion ? 'Dejar vacío para no cambiar' : ''}
          />
        </label>
        <label className="field">
          <span>Asignado a</span>
          <input value={f.asignado_a ?? ''} onChange={(e) => set('asignado_a', e.target.value)} />
        </label>
        <label className="field">
          <span>Área</span>
          <input value={f.area ?? ''} onChange={(e) => set('area', e.target.value)} />
        </label>
        <label className="field">
          <span>Correo/Tel. de recuperación</span>
          <input value={f.recuperacion ?? ''} onChange={(e) => set('recuperacion', e.target.value)} />
        </label>
        <label className="field">
          <span>Propósito</span>
          <input value={f.proposito ?? ''} onChange={(e) => set('proposito', e.target.value)} />
        </label>
        <label className="field">
          <span>Estado</span>
          <select value={f.estado} onChange={(e) => set('estado', e.target.value)}>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Notas</span>
        <textarea value={f.notas ?? ''} onChange={(e) => set('notas', e.target.value)} rows={2} />
      </label>
      <div className="modal-actions" style={{ marginTop: 8 }}>
        <button type="button" className="btn-ghost" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
