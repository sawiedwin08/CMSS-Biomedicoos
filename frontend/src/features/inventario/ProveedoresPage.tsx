import { Pencil, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import type { Proveedor } from '../../entities/proveedor'
import { useAuth } from '../../shared/auth/AuthContext'
import DataTable, { type Columna } from '../../shared/ui/DataTable'
import { cerrarAlClicFuera } from '../../shared/ui/overlay'
import {
  actualizarProveedor,
  crearProveedor,
  type DatosProveedor,
  eliminarProveedor,
  listarProveedores,
} from './proveedoresApi'

function detalleError(err: unknown, porDefecto: string): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    porDefecto
  )
}

export function ProveedoresPage() {
  const { puede } = useAuth()
  const puedeCrear = puede('inventario:crear')
  const puedeEditar = puede('inventario:editar')
  const puedeEliminar = puede('inventario:eliminar')

  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [editando, setEditando] = useState<Proveedor | null>(null)

  async function cargar() {
    setProveedores(await listarProveedores())
  }

  useEffect(() => {
    cargar()
      .catch((err) =>
        setError(detalleError(err, 'No se pudieron cargar los proveedores.')),
      )
      .finally(() => setCargando(false))
  }, [])

  async function borrar(p: Proveedor) {
    if (!window.confirm(`¿Eliminar el proveedor "${p.nombre}"?`)) return
    setError(null)
    setMensaje(null)
    try {
      await eliminarProveedor(p.id)
      await cargar()
      setMensaje('Proveedor eliminado.')
    } catch (err) {
      setError(detalleError(err, 'No se pudo eliminar el proveedor.'))
    }
  }

  if (cargando) return <div className="muted">Cargando proveedores…</div>

  const columnas: Columna<Proveedor>[] = [
    { id: 'nombre', header: 'Nombre', accessorFn: (p) => p.nombre },
    { id: 'nit', header: 'NIT', accessorFn: (p) => p.nit || '—' },
    { id: 'contacto', header: 'Contacto', accessorFn: (p) => p.contacto || '—' },
    { id: 'telefono', header: 'Teléfono', accessorFn: (p) => p.telefono || '—' },
    { id: 'email', header: 'Correo', accessorFn: (p) => p.email || '—' },
    {
      id: 'estado',
      header: 'Estado',
      accessorFn: (p) => p.activo,
      cell: ({ row }) => {
        const p = row.original
        return (
          <span className={p.activo ? 'estado-ok' : 'estado-off'}>
            {p.activo ? 'Activo' : 'Inactivo'}
          </span>
        )
      },
    },
    {
      id: 'acciones',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const p = row.original
        return (
          <>
            {puedeEditar && (
              <button
                className="icon-btn"
                title="Editar"
                onClick={() => {
                  setError(null)
                  setMensaje(null)
                  setEditando(p)
                }}
              >
                <Pencil size={16} />
              </button>
            )}
            {puedeEliminar && (
              <button className="icon-btn" title="Eliminar" onClick={() => borrar(p)}>
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
        <ProveedorForm
          titulo="Nuevo proveedor"
          onGuardar={async (datos) => {
            await crearProveedor(datos)
            await cargar()
            setMensaje('Proveedor creado correctamente.')
          }}
          onError={setError}
          reiniciar
        />
      )}

      <div className="card">
        {mensaje && <div className="alert-ok">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}

        <DataTable
          columns={columnas}
          data={proveedores}
          title="Proveedores"
          initialPageSize={15}
        />
      </div>

      {editando && (
        <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(() => setEditando(null))}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <ProveedorForm
              titulo="Editar proveedor"
              inicial={editando}
              onGuardar={async (datos) => {
                await actualizarProveedor(editando.id, datos)
                setEditando(null)
                await cargar()
                setMensaje('Proveedor actualizado.')
              }}
              onError={setError}
              onCancelar={() => setEditando(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ProveedorForm({
  titulo,
  inicial,
  onGuardar,
  onError,
  onCancelar,
  reiniciar,
}: {
  titulo: string
  inicial?: Proveedor
  onGuardar: (datos: DatosProveedor) => Promise<void>
  onError: (msg: string) => void
  onCancelar?: () => void
  reiniciar?: boolean
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [nit, setNit] = useState(inicial?.nit ?? '')
  const [contacto, setContacto] = useState(inicial?.contacto ?? '')
  const [telefono, setTelefono] = useState(inicial?.telefono ?? '')
  const [email, setEmail] = useState(inicial?.email ?? '')
  const [activo, setActivo] = useState(inicial?.activo ?? true)
  const [guardando, setGuardando] = useState(false)

  const enModal = Boolean(onCancelar)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      await onGuardar({
        nombre: nombre.trim(),
        nit: nit.trim() || null,
        contacto: contacto.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        activo,
      })
      if (reiniciar) {
        setNombre('')
        setNit('')
        setContacto('')
        setTelefono('')
        setEmail('')
        setActivo(true)
      }
    } catch (err) {
      onError(detalleError(err, 'No se pudo guardar el proveedor.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className={enModal ? '' : 'card form-inline'} onSubmit={onSubmit}>
      <h3>{titulo}</h3>
      <div className="form-grid">
        <label className="field">
          <span>Nombre</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
        </label>
        <label className="field">
          <span>NIT</span>
          <input value={nit} onChange={(e) => setNit(e.target.value)} />
        </label>
        <label className="field">
          <span>Contacto</span>
          <input value={contacto} onChange={(e) => setContacto(e.target.value)} />
        </label>
        <label className="field">
          <span>Teléfono</span>
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </label>
        <label className="field">
          <span>Correo</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
      </div>
      <label className="check-row">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        <span>Proveedor activo</span>
      </label>
      <div className={enModal ? 'modal-actions' : ''} style={{ marginTop: 8 }}>
        {onCancelar && (
          <button type="button" className="btn-ghost" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
