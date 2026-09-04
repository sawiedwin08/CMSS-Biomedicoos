import { Pencil, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import type { Sede } from '../../entities/sede'
import { useAuth } from '../../shared/auth/AuthContext'
import { type Columna, DataTable } from '../../shared/ui/DataTable'
import {
  actualizarSede,
  crearSede,
  type DatosSede,
  eliminarSede,
  listarSedes,
} from './sedesApi'

function detalleError(err: unknown, porDefecto: string): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    porDefecto
  )
}

export function SedesPage() {
  const { puede } = useAuth()
  const puedeCrear = puede('inventario:crear')
  const puedeEditar = puede('inventario:editar')
  const puedeEliminar = puede('inventario:eliminar')

  const [sedes, setSedes] = useState<Sede[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [editando, setEditando] = useState<Sede | null>(null)

  async function cargar() {
    setSedes(await listarSedes())
  }

  useEffect(() => {
    cargar()
      .catch((err) => setError(detalleError(err, 'No se pudieron cargar las sedes.')))
      .finally(() => setCargando(false))
  }, [])

  async function borrar(s: Sede) {
    if (!window.confirm(`¿Eliminar la sede "${s.nombre}"?`)) return
    setError(null)
    setMensaje(null)
    try {
      await eliminarSede(s.id)
      await cargar()
      setMensaje('Sede eliminada.')
    } catch (err) {
      setError(detalleError(err, 'No se pudo eliminar la sede.'))
    }
  }

  if (cargando) return <div className="muted">Cargando sedes…</div>

  const columnas: Columna<Sede>[] = [
    { header: 'Nombre', celda: (s) => s.nombre },
    { header: 'Ciudad', celda: (s) => s.ciudad || '—' },
    { header: 'Dirección', celda: (s) => s.direccion || '—' },
    {
      header: 'Estado',
      celda: (s) => (
        <span className={s.activo ? 'estado-ok' : 'estado-off'}>
          {s.activo ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
    {
      header: '',
      ancho: 90,
      celda: (s) => (
        <>
          {puedeEditar && (
            <button
              className="icon-btn"
              title="Editar"
              onClick={() => {
                setError(null)
                setMensaje(null)
                setEditando(s)
              }}
            >
              <Pencil size={16} />
            </button>
          )}
          {puedeEliminar && (
            <button className="icon-btn" title="Eliminar" onClick={() => borrar(s)}>
              <Trash2 size={16} />
            </button>
          )}
        </>
      ),
    },
  ]

  return (
    <div className="stack">
      {puedeCrear && (
        <SedeForm
          titulo="Nueva sede"
          onGuardar={async (datos) => {
            await crearSede(datos)
            await cargar()
            setMensaje('Sede creada correctamente.')
          }}
          onError={setError}
          reiniciarAlGuardar
        />
      )}

      <div className="card">
        <h2>Sedes</h2>
        {mensaje && <div className="alert-ok">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}

        <DataTable
          columnas={columnas}
          filas={sedes}
          keyOf={(s) => s.id}
          porPagina={15}
          vacio="Aún no hay sedes registradas."
        />
      </div>

      {editando && (
        <div className="modal-overlay" onClick={() => setEditando(null)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <SedeForm
              titulo="Editar sede"
              inicial={editando}
              onGuardar={async (datos) => {
                await actualizarSede(editando.id, datos)
                setEditando(null)
                await cargar()
                setMensaje('Sede actualizada.')
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

function SedeForm({
  titulo,
  inicial,
  onGuardar,
  onError,
  onCancelar,
  reiniciarAlGuardar,
}: {
  titulo: string
  inicial?: Sede
  onGuardar: (datos: DatosSede) => Promise<void>
  onError: (msg: string) => void
  onCancelar?: () => void
  reiniciarAlGuardar?: boolean
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [ciudad, setCiudad] = useState(inicial?.ciudad ?? '')
  const [direccion, setDireccion] = useState(inicial?.direccion ?? '')
  const [activo, setActivo] = useState(inicial?.activo ?? true)
  const [guardando, setGuardando] = useState(false)

  const enModal = Boolean(onCancelar)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      await onGuardar({
        nombre: nombre.trim(),
        ciudad: ciudad.trim() || null,
        direccion: direccion.trim() || null,
        activo,
      })
      if (reiniciarAlGuardar) {
        setNombre('')
        setCiudad('')
        setDireccion('')
        setActivo(true)
      }
    } catch (err) {
      onError(detalleError(err, 'No se pudo guardar la sede.'))
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
          <span>Ciudad</span>
          <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
        </label>
        <label className="field">
          <span>Dirección</span>
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </label>
      </div>
      <label className="check-row">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        <span>Sede activa</span>
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
