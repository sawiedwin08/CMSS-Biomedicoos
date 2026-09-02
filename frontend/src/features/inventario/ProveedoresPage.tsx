import { type FormEvent, useEffect, useState } from 'react'

import type { Proveedor } from '../../entities/proveedor'
import { useAuth } from '../../shared/auth/AuthContext'
import { type Columna, DataTable } from '../../shared/ui/DataTable'
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
    { header: 'Nombre', celda: (p) => p.nombre },
    { header: 'NIT', celda: (p) => p.nit || '—' },
    { header: 'Contacto', celda: (p) => p.contacto || '—' },
    { header: 'Teléfono', celda: (p) => p.telefono || '—' },
    { header: 'Correo', celda: (p) => p.email || '—' },
    {
      header: 'Estado',
      celda: (p) => (
        <span className={p.activo ? 'estado-ok' : 'estado-off'}>
          {p.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: '',
      ancho: 90,
      celda: (p) => (
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
              ✏️
            </button>
          )}
          {puedeEliminar && (
            <button className="icon-btn" title="Eliminar" onClick={() => borrar(p)}>
              🗑️
            </button>
          )}
        </>
      ),
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
        <h2>Proveedores</h2>
        {mensaje && <div className="alert-ok">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}

        <DataTable
          columnas={columnas}
          filas={proveedores}
          keyOf={(p) => p.id}
          porPagina={15}
          vacio="Aún no hay proveedores registrados."
        />
      </div>

      {editando && (
        <div className="modal-overlay" onClick={() => setEditando(null)}>
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
