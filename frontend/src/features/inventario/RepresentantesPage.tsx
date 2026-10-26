import { Pencil, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import type { Representante } from '../../entities/representante'
import { useAuth } from '../../shared/auth/AuthContext'
import DataTable, { type Columna } from '../../shared/ui/DataTable'
import { cerrarAlClicFuera } from '../../shared/ui/overlay'
import {
  actualizarRepresentante,
  crearRepresentante,
  type DatosRepresentante,
  eliminarRepresentante,
  listarRepresentantes,
} from './representantesApi'

function detalleError(err: unknown, porDefecto: string): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    porDefecto
  )
}

export function RepresentantesPage() {
  const { puede } = useAuth()
  const puedeCrear = puede('inventario:crear')
  const puedeEditar = puede('inventario:editar')
  const puedeEliminar = puede('inventario:eliminar')

  const [representantes, setRepresentantes] = useState<Representante[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [editando, setEditando] = useState<Representante | null>(null)

  async function cargar() {
    setRepresentantes(await listarRepresentantes())
  }

  useEffect(() => {
    cargar()
      .catch((err) =>
        setError(detalleError(err, 'No se pudieron cargar los representantes.')),
      )
      .finally(() => setCargando(false))
  }, [])

  async function borrar(r: Representante) {
    if (!window.confirm(`¿Eliminar el representante "${r.nombre}"?`)) return
    setError(null)
    setMensaje(null)
    try {
      await eliminarRepresentante(r.id)
      await cargar()
      setMensaje('Representante eliminado.')
    } catch (err) {
      setError(detalleError(err, 'No se pudo eliminar el representante.'))
    }
  }

  if (cargando) return <div className="muted">Cargando representantes…</div>

  const columnas: Columna<Representante>[] = [
    { id: 'nombre', header: 'Representante', accessorFn: (r) => r.nombre },
    { id: 'pais', header: 'País', accessorFn: (r) => r.pais || '—' },
    { id: 'ciudad', header: 'Ciudad', accessorFn: (r) => r.ciudad || '—' },
    { id: 'direccion', header: 'Dirección', accessorFn: (r) => r.direccion || '—' },
    { id: 'telefono', header: 'Teléfono', accessorFn: (r) => r.telefono || '—' },
    { id: 'correo', header: 'Correo', accessorFn: (r) => r.correo || '—' },
    {
      id: 'estado',
      header: 'Estado',
      accessorFn: (r) => r.activo,
      cell: ({ row }) => {
        const r = row.original
        return (
          <span className={r.activo ? 'estado-ok' : 'estado-off'}>
            {r.activo ? 'Activo' : 'Inactivo'}
          </span>
        )
      },
    },
    {
      id: 'acciones',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original
        return (
          <>
            {puedeEditar && (
              <button
                className="icon-btn"
                title="Editar"
                onClick={() => {
                  setError(null)
                  setMensaje(null)
                  setEditando(r)
                }}
              >
                <Pencil size={16} />
              </button>
            )}
            {puedeEliminar && (
              <button className="icon-btn" title="Eliminar" onClick={() => borrar(r)}>
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
        <RepresentanteForm
          titulo="Nuevo representante"
          onGuardar={async (datos) => {
            await crearRepresentante(datos)
            await cargar()
            setMensaje('Representante creado correctamente.')
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
          data={representantes}
          title="Representantes"
          initialPageSize={15}
        />
      </div>

      {editando && (
        <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(() => setEditando(null))}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <RepresentanteForm
              titulo="Editar representante"
              inicial={editando}
              onGuardar={async (datos) => {
                await actualizarRepresentante(editando.id, datos)
                setEditando(null)
                await cargar()
                setMensaje('Representante actualizado.')
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

function RepresentanteForm({
  titulo,
  inicial,
  onGuardar,
  onError,
  onCancelar,
  reiniciar,
}: {
  titulo: string
  inicial?: Representante
  onGuardar: (datos: DatosRepresentante) => Promise<void>
  onError: (msg: string) => void
  onCancelar?: () => void
  reiniciar?: boolean
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [pais, setPais] = useState(inicial?.pais ?? '')
  const [ciudad, setCiudad] = useState(inicial?.ciudad ?? '')
  const [direccion, setDireccion] = useState(inicial?.direccion ?? '')
  const [telefono, setTelefono] = useState(inicial?.telefono ?? '')
  const [correo, setCorreo] = useState(inicial?.correo ?? '')
  const [activo, setActivo] = useState(inicial?.activo ?? true)
  const [guardando, setGuardando] = useState(false)

  const enModal = Boolean(onCancelar)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      await onGuardar({
        nombre: nombre.trim(),
        pais: pais.trim() || null,
        ciudad: ciudad.trim() || null,
        direccion: direccion.trim() || null,
        telefono: telefono.trim() || null,
        correo: correo.trim() || null,
        activo,
      })
      if (reiniciar) {
        setNombre('')
        setPais('')
        setCiudad('')
        setDireccion('')
        setTelefono('')
        setCorreo('')
        setActivo(true)
      }
    } catch (err) {
      onError(detalleError(err, 'No se pudo guardar el representante.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className={enModal ? '' : 'card form-inline'} onSubmit={onSubmit}>
      <h3>{titulo}</h3>
      <div className="form-grid">
        <label className="field">
          <span>Representante</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
        </label>
        <label className="field">
          <span>País</span>
          <input value={pais} onChange={(e) => setPais(e.target.value)} />
        </label>
        <label className="field">
          <span>Ciudad</span>
          <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
        </label>
        <label className="field">
          <span>Dirección</span>
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </label>
        <label className="field">
          <span>Teléfono</span>
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </label>
        <label className="field">
          <span>Correo</span>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </label>
      </div>
      <label className="check-row">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        <span>Representante activo</span>
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
