import { Pencil, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import type { Sede } from '../../entities/sede'
import type { Servicio } from '../../entities/servicio'
import { useAuth } from '../../shared/auth/AuthContext'
import { type Columna, DataTable } from '../../shared/ui/DataTable'
import { listarSedes } from './sedesApi'
import {
  actualizarServicio,
  crearServicio,
  type DatosServicio,
  eliminarServicio,
  listarServicios,
} from './serviciosApi'

function detalleError(err: unknown, porDefecto: string): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    porDefecto
  )
}

export function ServiciosPage() {
  const { puede } = useAuth()
  const puedeCrear = puede('inventario:crear')
  const puedeEditar = puede('inventario:editar')
  const puedeEliminar = puede('inventario:eliminar')

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [editando, setEditando] = useState<Servicio | null>(null)

  async function cargar() {
    const [ss, sd] = await Promise.all([listarServicios(), listarSedes()])
    setServicios(ss)
    setSedes(sd)
  }

  useEffect(() => {
    cargar()
      .catch((err) =>
        setError(detalleError(err, 'No se pudieron cargar los servicios.')),
      )
      .finally(() => setCargando(false))
  }, [])

  async function borrar(s: Servicio) {
    if (!window.confirm(`¿Eliminar el servicio "${s.nombre}"?`)) return
    setError(null)
    setMensaje(null)
    try {
      await eliminarServicio(s.id)
      await cargar()
      setMensaje('Servicio eliminado.')
    } catch (err) {
      setError(detalleError(err, 'No se pudo eliminar el servicio.'))
    }
  }

  if (cargando) return <div className="muted">Cargando servicios…</div>

  const sinSedes = sedes.length === 0

  const columnas: Columna<Servicio>[] = [
    { header: 'Servicio', celda: (s) => s.nombre },
    { header: 'Sede', celda: (s) => s.sede_nombre || '—' },
    {
      header: 'Estado',
      celda: (s) => (
        <span className={s.activo ? 'estado-ok' : 'estado-off'}>
          {s.activo ? 'Activo' : 'Inactivo'}
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
      {puedeCrear &&
        (sinSedes ? (
          <div className="card aviso">
            Primero registra una <strong>sede</strong> para poder crear servicios.
          </div>
        ) : (
          <ServicioForm
            titulo="Nuevo servicio"
            sedes={sedes}
            onGuardar={async (datos) => {
              await crearServicio(datos)
              await cargar()
              setMensaje('Servicio creado correctamente.')
            }}
            onError={setError}
            reiniciar
          />
        ))}

      <div className="card">
        <h2>Servicios</h2>
        {mensaje && <div className="alert-ok">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}

        <DataTable
          columnas={columnas}
          filas={servicios}
          keyOf={(s) => s.id}
          porPagina={15}
          vacio="Aún no hay servicios registrados."
        />
      </div>

      {editando && (
        <div className="modal-overlay" onClick={() => setEditando(null)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <ServicioForm
              titulo="Editar servicio"
              sedes={sedes}
              inicial={editando}
              onGuardar={async (datos) => {
                await actualizarServicio(editando.id, datos)
                setEditando(null)
                await cargar()
                setMensaje('Servicio actualizado.')
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

function ServicioForm({
  titulo,
  sedes,
  inicial,
  onGuardar,
  onError,
  onCancelar,
  reiniciar,
}: {
  titulo: string
  sedes: Sede[]
  inicial?: Servicio
  onGuardar: (datos: DatosServicio) => Promise<void>
  onError: (msg: string) => void
  onCancelar?: () => void
  reiniciar?: boolean
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [sedeId, setSedeId] = useState<number | ''>(inicial?.sede_id ?? '')
  const [activo, setActivo] = useState(inicial?.activo ?? true)
  const [guardando, setGuardando] = useState(false)

  const enModal = Boolean(onCancelar)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (sedeId === '') {
      onError('Selecciona una sede.')
      return
    }
    setGuardando(true)
    try {
      await onGuardar({ nombre: nombre.trim(), sede_id: Number(sedeId), activo })
      if (reiniciar) {
        setNombre('')
        setSedeId('')
        setActivo(true)
      }
    } catch (err) {
      onError(detalleError(err, 'No se pudo guardar el servicio.'))
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
          <span>Sede</span>
          <select value={sedeId} onChange={(e) => setSedeId(Number(e.target.value))} required>
            <option value="" disabled>
              Selecciona…
            </option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="check-row">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        <span>Servicio activo</span>
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
