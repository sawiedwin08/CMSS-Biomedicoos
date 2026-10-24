import {
  ArrowRightLeft,
  Ban,
  ClipboardList,
  Download,
  Eye,
  type LucideIcon,
  MoreVertical,
  Paperclip,
  Pencil,
  Trash2,
  Upload,
  Wrench,
} from 'lucide-react'
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import {
  type Activo,
  type CategoriaActivo,
  ETIQUETA_CATEGORIA,
  ETIQUETA_ESTADO,
  ETIQUETA_MOTIVO_BAJA,
  type EstadoActivo,
  type MotivoBaja,
} from '../../entities/activo'
import { useAuth } from '../../shared/auth/AuthContext'
import DataTable, { type Columna } from '../../shared/ui/DataTable'
import { cerrarAlClicFuera } from '../../shared/ui/overlay'
import {
  actualizarActivo,
  crearActivo,
  darDeBajaActivo,
  type DatosActivo,
  descargarPlantilla,
  eliminarActivo,
  exportarActivos,
  importarActivos,
  listarActivos,
  listarBajas,
  listarAreasOpc,
  listarProveedoresOpc,
  listarSedesOpc,
  listarUsuariosOpc,
  type Opcion,
  type ResultadoImportacion,
  type DocumentoActivo,
  descargarDocumento,
  eliminarDocumento,
  listarDocumentos,
  subirDocumento,
  urlDocumento,
  type DatosMovimiento,
  type MovimientoActivo,
  listarMovimientos,
  registrarMovimiento,
  type AccesorioItem,
  type ActaAsignacionDatos,
  guardarActaAsignacion,
  previewActaAsignacion,
  type DatosMantenimiento,
  type Mantenimiento,
  type TipoMantenimiento,
  ETIQUETA_TIPO_MANT,
  eliminarMantenimiento,
  guardarHojaVida,
  listarMantenimientos,
  previewHojaVida,
  registrarMantenimiento,
} from './activosApi'
import { VisorPdfModal } from './VisorPdfModal'

function detalleError(err: unknown, porDefecto: string): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    porDefecto
  )
}

const CATEGORIAS: CategoriaActivo[] = ['computo', 'red', 'periferico']
const ESTADOS: EstadoActivo[] = [
  'operativo',
  'asignado',
  'en_bodega',
  'en_reparacion',
]

export function ActivosPage() {
  const { puede } = useAuth()
  const puedeCrear = puede('sistemas:crear')
  const puedeEditar = puede('sistemas:editar')
  const puedeEliminar = puede('sistemas:eliminar')

  const [activos, setActivos] = useState<Activo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [vistaBajas, setVistaBajas] = useState(false)

  const [texto, setTexto] = useState('')
  const [fCategoria, setFCategoria] = useState<CategoriaActivo | ''>('')
  const [fEstado, setFEstado] = useState<EstadoActivo | ''>('')

  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<Activo | null>(null)
  const [dandoBaja, setDandoBaja] = useState<Activo | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const [impResult, setImpResult] = useState<ResultadoImportacion | null>(null)
  const [importando, setImportando] = useState(false)

  const [docsDe, setDocsDe] = useState<Activo | null>(null)
  const [movsDe, setMovsDe] = useState<Activo | null>(null)
  const [actaDe, setActaDe] = useState<Activo | null>(null)
  const [mantDe, setMantDe] = useState<Activo | null>(null)

  const [sedes, setSedes] = useState<Opcion[]>([])
  const [areas, setAreas] = useState<Opcion[]>([])
  const [proveedores, setProveedores] = useState<Opcion[]>([])
  const [usuarios, setUsuarios] = useState<Opcion[]>([])

  useEffect(() => {
    Promise.all([
      listarSedesOpc(),
      listarAreasOpc(),
      listarProveedoresOpc(),
      listarUsuariosOpc(),
    ]).then(([s, a, p, u]) => {
      setSedes(s)
      setAreas(a)
      setProveedores(p)
      setUsuarios(u)
    })
  }, [])

  async function cargar() {
    if (vistaBajas) {
      setActivos(await listarBajas())
    } else {
      setActivos(
        await listarActivos({
          texto: texto || undefined,
          categoria: fCategoria || undefined,
          estado: fEstado || undefined,
        }),
      )
    }
  }

  useEffect(() => {
    setCargando(true)
    cargar()
      .catch((err) => setError(detalleError(err, 'No se pudieron cargar los activos.')))
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaBajas, texto, fCategoria, fEstado])

  const nombreUsuario = useMemo(() => {
    const mapa = new Map(usuarios.map((u) => [u.id, u.nombre]))
    return (id: number | null) => (id ? mapa.get(id) ?? `#${id}` : '—')
  }, [usuarios])

  async function borrar(a: Activo) {
    if (!window.confirm(`¿Eliminar definitivamente el activo "${a.codigo_interno}"?`)) return
    setError(null)
    setMensaje(null)
    try {
      await eliminarActivo(a.id)
      await cargar()
      setMensaje('Activo eliminado.')
    } catch (err) {
      setError(detalleError(err, 'No se pudo eliminar el activo.'))
    }
  }

  async function onArchivo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setMensaje(null)
    setImpResult(null)
    setImportando(true)
    try {
      const r = await importarActivos(file)
      setImpResult(r)
      await cargar()
      setMensaje(`Importación: ${r.creados} de ${r.total} creados.`)
    } catch (err) {
      setError(detalleError(err, 'No se pudo importar el archivo.'))
    } finally {
      setImportando(false)
    }
  }

  const columnas: Columna<Activo>[] = [
    { id: 'codigo', header: 'Código', accessorFn: (a) => a.codigo_interno },
    { id: 'nombre', header: 'Nombre', accessorFn: (a) => a.nombre },
    {
      id: 'categoria',
      header: 'Categoría',
      accessorFn: (a) => ETIQUETA_CATEGORIA[a.categoria],
    },
    {
      id: 'estado',
      header: 'Estado',
      accessorFn: (a) => a.estado,
      cell: ({ row }) => {
        const a = row.original
        return (
          <span className={a.estado === 'operativo' ? 'estado-ok' : 'estado-off'}>
            {ETIQUETA_ESTADO[a.estado]}
          </span>
        )
      },
    },
    { id: 'marca', header: 'Marca / Modelo', accessorFn: (a) => [a.marca, a.modelo].filter(Boolean).join(' ') || '—' },
    { id: 'serial', header: 'Serial', accessorFn: (a) => a.serial || '—' },
    ...(vistaBajas
      ? [
          {
            id: 'motivo',
            header: 'Motivo de baja',
            accessorFn: (a: Activo) => (a.motivo_baja ? ETIQUETA_MOTIVO_BAJA[a.motivo_baja] : '—'),
          },
          { id: 'fecha_baja', header: 'Fecha de baja', accessorFn: (a: Activo) => a.fecha_baja || '—' },
        ]
      : [
          { id: 'asignado', header: 'Asignado a', accessorFn: (a: Activo) => nombreUsuario(a.asignado_a_usuario_id) },
        ]),
    {
      id: 'acciones',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const a = row.original
        return (
          <AccionesMenu
            editable={puedeEditar && !vistaBajas}
            enInventario={!vistaBajas}
            puedeEliminar={puedeEliminar}
            onEditar={() => {
              setError(null)
              setMensaje(null)
              setEditando(a)
            }}
            onDocumentos={() => setDocsDe(a)}
            onTrasladar={() => setMovsDe(a)}
            onActa={() => setActaDe(a)}
            onMantenimientos={() => setMantDe(a)}
            onBaja={() => setDandoBaja(a)}
            onEliminar={() => borrar(a)}
          />
        )
      },
    },
  ]

  return (
    <div className="stack">
      <div className="card">
        <div className="toolbar">
          <div className="tabs">
            <button
              className={!vistaBajas ? 'tab activo' : 'tab'}
              onClick={() => setVistaBajas(false)}
            >
              Inventario
            </button>
            <button
              className={vistaBajas ? 'tab activo' : 'tab'}
              onClick={() => setVistaBajas(true)}
            >
              Bajas y retiros
            </button>
          </div>
          {!vistaBajas && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-ghost" onClick={() => descargarPlantilla()}>
                Plantilla
              </button>
              {puedeCrear && (
                <button
                  className="btn-ghost"
                  disabled={importando}
                  onClick={() => fileRef.current?.click()}
                >
                  {importando ? 'Importando…' : 'Importar Excel'}
                </button>
              )}
              <button className="btn-ghost" onClick={() => exportarActivos()}>
                Exportar
              </button>
              {puedeCrear && (
                <button className="btn-primary" onClick={() => setCreando(true)}>
                  + Nuevo activo
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx"
                style={{ display: 'none' }}
                onChange={onArchivo}
              />
            </div>
          )}
        </div>

        {!vistaBajas && (
          <div className="form-grid" style={{ marginTop: 8 }}>
            <label className="field">
              <span>Buscar</span>
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Código, nombre, serial, placa…"
              />
            </label>
            <label className="field">
              <span>Categoría</span>
              <select value={fCategoria} onChange={(e) => setFCategoria(e.target.value as CategoriaActivo | '')}>
                <option value="">Todas</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {ETIQUETA_CATEGORIA[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Estado</span>
              <select value={fEstado} onChange={(e) => setFEstado(e.target.value as EstadoActivo | '')}>
                <option value="">Todos</option>
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>
                    {ETIQUETA_ESTADO[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="card">
        {mensaje && <div className="alert-ok">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}
        {cargando ? (
          <div className="muted">Cargando activos…</div>
        ) : (
          <DataTable
            columns={columnas}
            data={activos}
            title={vistaBajas ? 'Bajas y retiros' : 'Inventario de activos'}
            initialPageSize={15}
          />
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
          <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 820 }}>
            <ActivoForm
              titulo={editando ? 'Editar activo' : 'Nuevo activo'}
              inicial={editando ?? undefined}
              sedes={sedes}
              areas={areas}
              proveedores={proveedores}
              usuarios={usuarios}
              onGuardar={async (datos) => {
                if (editando) {
                  await actualizarActivo(editando.id, datos)
                  setMensaje('Activo actualizado.')
                } else {
                  await crearActivo(datos)
                  setMensaje('Activo registrado correctamente.')
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

      {dandoBaja && (
        <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(() => setDandoBaja(null))}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <BajaForm
              activo={dandoBaja}
              onConfirmar={async (motivo, autorizado, acta) => {
                await darDeBajaActivo(dandoBaja.id, {
                  motivo_baja: motivo,
                  baja_autorizado_por: autorizado || null,
                  acta_baja: acta || null,
                })
                setDandoBaja(null)
                setMensaje('Activo dado de baja.')
                await cargar()
              }}
              onError={setError}
              onCancelar={() => setDandoBaja(null)}
            />
          </div>
        </div>
      )}

      {impResult && impResult.errores.length > 0 && (
        <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(() => setImpResult(null))}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h3>Resultado de la importación</h3>
            <p className="muted">
              {impResult.creados} de {impResult.total} creados. {impResult.errores.length} con error:
            </p>
            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              <ul>
                {impResult.errores.map((er, i) => (
                  <li key={i}>
                    Fila {er.fila}: {er.mensaje}
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setImpResult(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {docsDe && (
        <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(() => setDocsDe(null))}>
          <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <DocumentosModal
              activo={docsDe}
              puedeEditar={puedeEditar}
              onError={setError}
              onCerrar={() => setDocsDe(null)}
            />
          </div>
        </div>
      )}

      {movsDe && (
        <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(() => setMovsDe(null))}>
          <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <MovimientosModal
              activo={movsDe}
              puedeEditar={puedeEditar && !vistaBajas}
              sedes={sedes}
              areas={areas}
              usuarios={usuarios}
              onError={setError}
              onCambio={cargar}
              onCerrar={() => setMovsDe(null)}
            />
          </div>
        </div>
      )}

      {actaDe && (
        <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(() => setActaDe(null))}>
          <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 860 }}>
            <ActaAsignacionModal
              activo={actaDe}
              usuarios={usuarios}
              areas={areas}
              onError={setError}
              onGuardado={() => {
                setActaDe(null)
                setMensaje('Acta de asignación generada y guardada en los documentos del activo.')
              }}
              onCerrar={() => setActaDe(null)}
            />
          </div>
        </div>
      )}

      {mantDe && (
        <div className="modal-overlay" onMouseDown={cerrarAlClicFuera(() => setMantDe(null))}>
          <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 820 }}>
            <MantenimientoModal
              activo={mantDe}
              puedeEditar={puedeEditar}
              onError={setError}
              onMensaje={setMensaje}
              onCerrar={() => setMantDe(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function AccionesMenu({
  editable,
  enInventario,
  puedeEliminar,
  onEditar,
  onDocumentos,
  onTrasladar,
  onActa,
  onMantenimientos,
  onBaja,
  onEliminar,
}: {
  editable: boolean
  enInventario: boolean
  puedeEliminar: boolean
  onEditar: () => void
  onDocumentos: () => void
  onTrasladar: () => void
  onActa: () => void
  onMantenimientos: () => void
  onBaja: () => void
  onEliminar: () => void
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)

  function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    setOpen(true)
  }

  const items: { icon: LucideIcon; texto: string; fn: () => void; peligro?: boolean }[] = []
  if (editable) items.push({ icon: ArrowRightLeft, texto: 'Trasladar / reasignar', fn: onTrasladar })
  if (editable) items.push({ icon: ClipboardList, texto: 'Acta de asignación', fn: onActa })
  if (enInventario)
    items.push({ icon: Wrench, texto: 'Mantenimientos / Hoja de vida', fn: onMantenimientos })
  if (editable) items.push({ icon: Ban, texto: 'Dar de baja', fn: onBaja })
  if (puedeEliminar) items.push({ icon: Trash2, texto: 'Eliminar', fn: onEliminar, peligro: true })

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {editable && (
        <button className="icon-btn" title="Editar" onClick={onEditar}>
          <Pencil size={16} />
        </button>
      )}
      <button className="icon-btn" title="Documentos" onClick={onDocumentos}>
        <Paperclip size={16} />
      </button>
      {items.length > 0 && (
        <button ref={btnRef} className="icon-btn" title="Más acciones" onClick={toggle}>
          <MoreVertical size={16} />
        </button>
      )}
      {open && pos && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 59 }} />
          <div
            className="menu-acciones"
            style={{ position: 'fixed', right: pos.right, top: pos.top, zIndex: 60 }}
          >
            {items.map((it, i) => {
              const Icon = it.icon
              return (
                <button
                  key={i}
                  className={it.peligro ? 'menu-accion-item peligro' : 'menu-accion-item'}
                  onClick={() => {
                    setOpen(false)
                    it.fn()
                  }}
                >
                  <Icon size={16} />
                  <span>{it.texto}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

const TIPOS_DOC = ['factura', 'garantia', 'acta', 'manual', 'otro']

function formatoKB(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(0)} KB`
}

function DocumentosModal({
  activo,
  puedeEditar,
  onError,
  onCerrar,
}: {
  activo: Activo
  puedeEditar: boolean
  onError: (msg: string) => void
  onCerrar: () => void
}) {
  const [docs, setDocs] = useState<DocumentoActivo[]>([])
  const [cargando, setCargando] = useState(true)
  const [tipo, setTipo] = useState('factura')
  const [descripcion, setDescripcion] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [verUrl, setVerUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function cargar() {
    setDocs(await listarDocumentos(activo.id))
  }

  async function ver(d: DocumentoActivo) {
    try {
      setVerUrl(await urlDocumento(activo.id, d.id))
    } catch (err) {
      onError(detalleError(err, 'No se pudo abrir el documento.'))
    }
  }

  useEffect(() => {
    cargar()
      .catch((err) => onError(detalleError(err, 'No se pudieron cargar los documentos.')))
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onArchivo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSubiendo(true)
    try {
      await subirDocumento(activo.id, tipo, file, descripcion.trim() || undefined)
      setDescripcion('')
      await cargar()
    } catch (err) {
      onError(detalleError(err, 'No se pudo subir el documento.'))
    } finally {
      setSubiendo(false)
    }
  }

  async function borrar(d: DocumentoActivo) {
    if (!window.confirm(`¿Eliminar "${d.nombre_archivo}"?`)) return
    try {
      await eliminarDocumento(activo.id, d.id)
      await cargar()
    } catch (err) {
      onError(detalleError(err, 'No se pudo eliminar el documento.'))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
      <h3 style={{ marginBottom: 8 }}>Documentos — {activo.codigo_interno}</h3>

      {puedeEditar && (
        <div className="form-grid" style={{ alignItems: 'end' }}>
          <label className="field">
            <span>Tipo</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS_DOC.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Descripción (opcional)</span>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </label>
          <button
            className="btn-ghost"
            disabled={subiendo}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={16} /> {subiendo ? 'Subiendo…' : 'Subir archivo'}
          </button>
          <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onArchivo} />
        </div>
      )}

      <div style={{ overflowY: 'auto', flex: 1, marginTop: 8 }}>
        {cargando ? (
          <div className="muted">Cargando…</div>
        ) : docs.length === 0 ? (
          <div className="muted">Sin documentos.</div>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Archivo</th>
                <th>Tamaño</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.tipo}</td>
                  <td>{d.nombre_archivo}</td>
                  <td>{formatoKB(d.tamano_bytes)}</td>
                  <td>
                    <button className="icon-btn" title="Ver" onClick={() => ver(d)}>
                      <Eye size={16} />
                    </button>
                    <button
                      className="icon-btn"
                      title="Descargar"
                      onClick={() => descargarDocumento(activo.id, d)}
                    >
                      <Download size={16} />
                    </button>
                    {puedeEditar && (
                      <button className="icon-btn" title="Eliminar" onClick={() => borrar(d)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {verUrl && (
          <VisorPdfModal url={verUrl} titulo="Documento" onCerrar={() => setVerUrl(null)} />
        )}
      </div>

      <div className="modal-actions" style={{ marginTop: 12 }}>
        <button className="btn-primary" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  )
}

function MovimientosModal({
  activo,
  puedeEditar,
  sedes,
  areas,
  usuarios,
  onError,
  onCambio,
  onCerrar,
}: {
  activo: Activo
  puedeEditar: boolean
  sedes: Opcion[]
  areas: Opcion[]
  usuarios: Opcion[]
  onError: (msg: string) => void
  onCambio: () => Promise<void>
  onCerrar: () => void
}) {
  const [movs, setMovs] = useState<MovimientoActivo[]>([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState<DatosMovimiento>({
    sede_destino_id: activo.sede_id,
    area_destino_id: activo.area_id,
    usuario_destino_id: activo.asignado_a_usuario_id,
    motivo: '',
    responsable: '',
  })
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setMovs(await listarMovimientos(activo.id))
  }

  useEffect(() => {
    cargar()
      .catch((err) => onError(detalleError(err, 'No se pudo cargar el historial.')))
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const areasDeSede = form.sede_destino_id
    ? areas.filter((a) => a.sede_id === form.sede_destino_id)
    : areas

  async function registrar() {
    setGuardando(true)
    try {
      await registrarMovimiento(activo.id, form)
      await cargar()
      await onCambio()
    } catch (err) {
      onError(detalleError(err, 'No se pudo registrar el movimiento.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
      <h3 style={{ marginBottom: 8 }}>Movimientos — {activo.codigo_interno}</h3>

      {puedeEditar && (
        <>
          <h4>Trasladar / reasignar</h4>
          <div className="form-grid">
            <label className="field">
              <span>Sede destino</span>
              <select
                value={form.sede_destino_id ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sede_destino_id: e.target.value ? Number(e.target.value) : null,
                    area_destino_id: null,
                  }))
                }
              >
                <option value="">—</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Área destino</span>
              <select
                value={form.area_destino_id ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    area_destino_id: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              >
                <option value="">—</option>
                {areasDeSede.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Asignar a</span>
              <select
                value={form.usuario_destino_id ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    usuario_destino_id: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              >
                <option value="">—</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Motivo</span>
              <input
                value={form.motivo ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Responsable</span>
              <input
                value={form.responsable ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, responsable: e.target.value }))}
              />
            </label>
          </div>
          <button className="btn-primary" disabled={guardando} onClick={registrar} style={{ marginTop: 4 }}>
            {guardando ? 'Registrando…' : 'Registrar movimiento'}
          </button>
        </>
      )}

      <h4>Historial</h4>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {cargando ? (
          <div className="muted">Cargando…</div>
        ) : movs.length === 0 ? (
          <div className="muted">Sin movimientos registrados.</div>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Destino (sede / área)</th>
                <th>Asignado</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movs.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.fecha_movimiento).toLocaleDateString()}</td>
                  <td>
                    {[m.sede_destino_nombre, m.area_destino_nombre].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td>{m.usuario_destino_nombre || '—'}</td>
                  <td>{m.motivo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="modal-actions" style={{ marginTop: 12 }}>
        <button className="btn-primary" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  )
}

// --- Acta de asignación --------------------------------------------------

const ACCESORIOS_BASE = [
  'Mouse',
  'Teclado',
  'Cargador / Adaptador',
  'Maletín / Estuche',
  'Diadema / Audífonos',
  'Cámara web',
  'Cable de red / poder',
  'Otros',
]

function ActaAsignacionModal({
  activo,
  usuarios,
  areas,
  onError,
  onGuardado,
  onCerrar,
}: {
  activo: Activo
  usuarios: Opcion[]
  areas: Opcion[]
  onError: (msg: string) => void
  onGuardado: () => void
  onCerrar: () => void
}) {
  const asignado = usuarios.find((u) => u.id === activo.asignado_a_usuario_id)?.nombre ?? ''
  const dependencia = areas.find((a) => a.id === activo.area_id)?.nombre ?? ''

  const [form, setForm] = useState<ActaAsignacionDatos>({
    fecha: new Date().toISOString().slice(0, 10),
    funcionario_nombre: asignado,
    funcionario_documento: '',
    funcionario_cargo: '',
    dependencia,
    correo: '',
    telefono: '',
    estado_condicion: 'nuevo',
    observaciones_estado: '',
    accesorios: ACCESORIOS_BASE.map((n) => ({
      nombre: n,
      entregado:
        (n === 'Mouse' && activo.inc_mouse) ||
        (n === 'Teclado' && activo.inc_teclado) ||
        (n === 'Cable de red / poder' && (activo.inc_cable_poder || activo.inc_cable_video)),
      marca_serie: '',
      observaciones: '',
    })),
    entrega_nombre: '',
    entrega_cargo: '',
    recibe_nombre: asignado,
    recibe_cargo: '',
  })
  const [preview, setPreview] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  function set<K extends keyof ActaAsignacionDatos>(k: K, v: ActaAsignacionDatos[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }
  function setAcc(i: number, patch: Partial<AccesorioItem>) {
    setForm((f) => ({
      ...f,
      accesorios: f.accesorios.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    }))
  }

  async function previsualizar() {
    setGenerando(true)
    try {
      setPreview(await previewActaAsignacion(activo.id, form))
    } catch (err) {
      onError(detalleError(err, 'No se pudo generar la vista previa.'))
    } finally {
      setGenerando(false)
    }
  }

  async function guardar() {
    setGuardando(true)
    try {
      await guardarActaAsignacion(activo.id, form)
      onGuardado()
    } catch (err) {
      onError(detalleError(err, 'No se pudo guardar el acta.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '82vh' }}>
      <h3 style={{ marginBottom: 8 }}>Acta de asignación — {activo.codigo_interno}</h3>

      <div style={{ overflowY: 'auto', flex: 1, paddingRight: 6 }}>
        <h4>Funcionario asignado</h4>
        <div className="form-grid">
          <label className="field">
            <span>Nombre</span>
            <input
              value={form.funcionario_nombre ?? ''}
              onChange={(e) => set('funcionario_nombre', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Documento</span>
            <input
              value={form.funcionario_documento ?? ''}
              onChange={(e) => set('funcionario_documento', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Cargo</span>
            <input
              value={form.funcionario_cargo ?? ''}
              onChange={(e) => set('funcionario_cargo', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Dependencia / Ubicación</span>
            <input value={form.dependencia ?? ''} onChange={(e) => set('dependencia', e.target.value)} />
          </label>
          <label className="field">
            <span>Correo</span>
            <input value={form.correo ?? ''} onChange={(e) => set('correo', e.target.value)} />
          </label>
          <label className="field">
            <span>Teléfono / Extensión</span>
            <input value={form.telefono ?? ''} onChange={(e) => set('telefono', e.target.value)} />
          </label>
          <label className="field">
            <span>Fecha de asignación</span>
            <input
              type="date"
              value={form.fecha ?? ''}
              onChange={(e) => set('fecha', e.target.value || null)}
            />
          </label>
        </div>

        <h4>Estado al asignar</h4>
        <div className="form-grid">
          <label className="field">
            <span>Condición</span>
            <select
              value={form.estado_condicion ?? 'nuevo'}
              onChange={(e) => set('estado_condicion', e.target.value)}
            >
              <option value="nuevo">Nuevo</option>
              <option value="usado">Usado</option>
              <option value="reasignado">Reasignado</option>
            </select>
          </label>
          <label className="field" style={{ gridColumn: 'span 2' }}>
            <span>Observaciones del estado</span>
            <input
              value={form.observaciones_estado ?? ''}
              onChange={(e) => set('observaciones_estado', e.target.value)}
            />
          </label>
        </div>

        <h4>Accesorios entregados</h4>
        <table className="tabla">
          <thead>
            <tr>
              <th>Accesorio</th>
              <th>Entregado</th>
              <th>Marca / Serie</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {form.accesorios.map((a, i) => (
              <tr key={a.nombre}>
                <td>{a.nombre}</td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={a.entregado}
                    onChange={(e) => setAcc(i, { entregado: e.target.checked })}
                  />
                </td>
                <td>
                  <input
                    value={a.marca_serie ?? ''}
                    onChange={(e) => setAcc(i, { marca_serie: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    value={a.observaciones ?? ''}
                    onChange={(e) => setAcc(i, { observaciones: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>Firmas</h4>
        <div className="form-grid">
          <label className="field">
            <span>Entrega — Nombre</span>
            <input
              value={form.entrega_nombre ?? ''}
              onChange={(e) => set('entrega_nombre', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Entrega — Cargo</span>
            <input
              value={form.entrega_cargo ?? ''}
              onChange={(e) => set('entrega_cargo', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Recibe — Nombre</span>
            <input
              value={form.recibe_nombre ?? ''}
              onChange={(e) => set('recibe_nombre', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Recibe — Cargo</span>
            <input
              value={form.recibe_cargo ?? ''}
              onChange={(e) => set('recibe_cargo', e.target.value)}
            />
          </label>
        </div>

        {preview && (
          <iframe
            src={preview}
            title="Vista previa del acta"
            style={{ width: '100%', height: 420, border: '1px solid var(--borde)', marginTop: 10 }}
          />
        )}
      </div>

      <div className="modal-actions" style={{ marginTop: 12 }}>
        <button className="btn-ghost" onClick={onCerrar}>
          Cerrar
        </button>
        <button className="btn-ghost" disabled={generando} onClick={previsualizar}>
          {generando ? 'Generando…' : 'Previsualizar'}
        </button>
        <button className="btn-primary" disabled={guardando} onClick={guardar}>
          {guardando ? 'Guardando…' : 'Guardar acta'}
        </button>
      </div>
    </div>
  )
}

// --- Formulario de alta/edición -------------------------------------------

function vacio(): DatosActivo {
  return {
    codigo_interno: '',
    categoria: 'computo',
    nombre: '',
    estado: 'operativo',
    marca: null,
    modelo: null,
    serial: null,
    placa_inventario: null,
    sede_id: null,
    area_id: null,
    piso: null,
    asignado_a_usuario_id: null,
    fecha_asignacion: null,
    fecha_adquisicion: null,
    proveedor_id: null,
    costo: null,
    orden_compra: null,
    factura: null,
    garantia_inicio: null,
    garantia_fin: null,
    observaciones: null,
    ip: null,
    mac: null,
    tipo_computo: null,
    hostname: null,
    cpu: null,
    ram_capacidad: null,
    ram_tipo: null,
    disco_tipo: null,
    disco_capacidad: null,
    sistema_operativo: null,
    dominio: null,
    inc_teclado: false,
    inc_mouse: false,
    inc_cable_poder: false,
    inc_cable_video: false,
    accesorios_otro: null,
    tipo_red: null,
    num_puertos: null,
    poe: false,
    firmware: null,
    ubicacion_fisica: null,
    config_notas: null,
    tipo_periferico: null,
    asociado_a_activo_id: null,
    monitor_pulgadas: null,
    monitor_resolucion: null,
    impresora_tecnologia: null,
    impresora_conexion: null,
  }
}

function desde(a: Activo): DatosActivo {
  const { id, fecha_baja, motivo_baja, baja_autorizado_por, acta_baja, ...resto } = a
  void id
  void fecha_baja
  void motivo_baja
  void baja_autorizado_por
  void acta_baja
  return resto
}

function ActivoForm({
  titulo,
  inicial,
  sedes,
  areas,
  proveedores,
  usuarios,
  onGuardar,
  onError,
  onCancelar,
}: {
  titulo: string
  inicial?: Activo
  sedes: Opcion[]
  areas: Opcion[]
  proveedores: Opcion[]
  usuarios: Opcion[]
  onGuardar: (datos: DatosActivo) => Promise<void>
  onError: (msg: string) => void
  onCancelar: () => void
}) {
  const [form, setForm] = useState<DatosActivo>(inicial ? desde(inicial) : vacio())
  const [guardando, setGuardando] = useState(false)

  function set<K extends keyof DatosActivo>(key: K, value: DatosActivo[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Texto que vacío se envía como null (todo menos los requeridos de texto).
  const mantenerString = new Set(['codigo_interno', 'nombre', 'categoria', 'estado'])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, !mantenerString.has(k) && v === '' ? null : v]),
      ) as DatosActivo
      await onGuardar(payload)
    } catch (err) {
      onError(detalleError(err, 'No se pudo guardar el activo.'))
    } finally {
      setGuardando(false)
    }
  }

  const areasDeSede = form.sede_id ? areas.filter((a) => a.sede_id === form.sede_id) : areas

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}
    >
      <h3 style={{ marginBottom: 8 }}>{titulo}</h3>

      <div style={{ overflowY: 'auto', overflowX: 'hidden', paddingRight: 6, flex: 1 }}>
      <div className="form-grid">
        <label className="field">
          <span>Categoría *</span>
          <select
            value={form.categoria}
            onChange={(e) => set('categoria', e.target.value as CategoriaActivo)}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {ETIQUETA_CATEGORIA[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Código interno</span>
          <input
            value={form.codigo_interno}
            onChange={(e) => set('codigo_interno', e.target.value)}
            placeholder="Automático (SIS-0001) si se deja vacío"
          />
        </label>
        <label className="field">
          <span>Nombre *</span>
          <input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
        </label>
        <label className="field">
          <span>Estado</span>
          <select value={form.estado} onChange={(e) => set('estado', e.target.value as EstadoActivo)}>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {ETIQUETA_ESTADO[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Marca</span>
          <input value={form.marca ?? ''} onChange={(e) => set('marca', e.target.value)} />
        </label>
        <label className="field">
          <span>Modelo</span>
          <input value={form.modelo ?? ''} onChange={(e) => set('modelo', e.target.value)} />
        </label>
        <label className="field">
          <span>Serial</span>
          <input value={form.serial ?? ''} onChange={(e) => set('serial', e.target.value)} />
        </label>
        <label className="field">
          <span>Placa / etiqueta</span>
          <input
            value={form.placa_inventario ?? ''}
            onChange={(e) => set('placa_inventario', e.target.value)}
          />
        </label>
      </div>

      <h4>Ubicación y asignación</h4>
      <div className="form-grid">
        <label className="field">
          <span>Sede</span>
          <select
            value={form.sede_id ?? ''}
            onChange={(e) => set('sede_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">—</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Área</span>
          <select
            value={form.area_id ?? ''}
            onChange={(e) => set('area_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">—</option>
            {areasDeSede.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Piso</span>
          <input value={form.piso ?? ''} onChange={(e) => set('piso', e.target.value)} />
        </label>
        <label className="field">
          <span>Asignado a</span>
          <select
            value={form.asignado_a_usuario_id ?? ''}
            onChange={(e) =>
              set('asignado_a_usuario_id', e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">—</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {form.categoria === 'computo' && (
        <>
          <h4>Equipo de cómputo</h4>
          <div className="form-grid">
            <label className="field">
              <span>Tipo</span>
              <select
                value={form.tipo_computo ?? ''}
                onChange={(e) => set('tipo_computo', (e.target.value || null) as DatosActivo['tipo_computo'])}
              >
                <option value="">—</option>
                <option value="escritorio">Escritorio</option>
                <option value="portatil">Portátil</option>
                <option value="servidor">Servidor</option>
                <option value="aio">All-in-One</option>
              </select>
            </label>
            <label className="field">
              <span>Hostname</span>
              <input value={form.hostname ?? ''} onChange={(e) => set('hostname', e.target.value)} />
            </label>
            <label className="field">
              <span>CPU</span>
              <input value={form.cpu ?? ''} onChange={(e) => set('cpu', e.target.value)} />
            </label>
            <label className="field">
              <span>RAM (capacidad)</span>
              <input value={form.ram_capacidad ?? ''} onChange={(e) => set('ram_capacidad', e.target.value)} />
            </label>
            <label className="field">
              <span>RAM (tipo)</span>
              <input value={form.ram_tipo ?? ''} onChange={(e) => set('ram_tipo', e.target.value)} placeholder="DDR4…" />
            </label>
            <label className="field">
              <span>Disco (tipo)</span>
              <select value={form.disco_tipo ?? ''} onChange={(e) => set('disco_tipo', e.target.value || null)}>
                <option value="">—</option>
                <option value="HDD">HDD</option>
                <option value="SSD">SSD</option>
                <option value="NVMe">NVMe</option>
              </select>
            </label>
            <label className="field">
              <span>Disco (capacidad)</span>
              <input value={form.disco_capacidad ?? ''} onChange={(e) => set('disco_capacidad', e.target.value)} />
            </label>
            <label className="field">
              <span>Sistema operativo</span>
              <input value={form.sistema_operativo ?? ''} onChange={(e) => set('sistema_operativo', e.target.value)} />
            </label>
            <label className="field">
              <span>IP</span>
              <input value={form.ip ?? ''} onChange={(e) => set('ip', e.target.value)} />
            </label>
            <label className="field">
              <span>MAC</span>
              <input value={form.mac ?? ''} onChange={(e) => set('mac', e.target.value)} />
            </label>
            <label className="field">
              <span>Dominio / grupo</span>
              <input value={form.dominio ?? ''} onChange={(e) => set('dominio', e.target.value)} />
            </label>
          </div>
          <div className="check-row" style={{ gap: 16, flexWrap: 'wrap' }}>
            <label className="check-row">
              <input type="checkbox" checked={form.inc_teclado} onChange={(e) => set('inc_teclado', e.target.checked)} />
              <span>Teclado</span>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={form.inc_mouse} onChange={(e) => set('inc_mouse', e.target.checked)} />
              <span>Mouse</span>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={form.inc_cable_poder} onChange={(e) => set('inc_cable_poder', e.target.checked)} />
              <span>Cable de poder</span>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={form.inc_cable_video} onChange={(e) => set('inc_cable_video', e.target.checked)} />
              <span>Cable de video</span>
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>Otro accesorio</span>
              <input value={form.accesorios_otro ?? ''} onChange={(e) => set('accesorios_otro', e.target.value)} />
            </label>
          </div>
        </>
      )}

      {form.categoria === 'red' && (
        <>
          <h4>Equipo de red</h4>
          <div className="form-grid">
            <label className="field">
              <span>Tipo</span>
              <select
                value={form.tipo_red ?? ''}
                onChange={(e) => set('tipo_red', (e.target.value || null) as DatosActivo['tipo_red'])}
              >
                <option value="">—</option>
                <option value="router">Router</option>
                <option value="switch">Switch</option>
                <option value="access_point">Access Point</option>
                <option value="firewall">Firewall</option>
                <option value="modem">Módem</option>
              </select>
            </label>
            <label className="field">
              <span>IP de gestión</span>
              <input value={form.ip ?? ''} onChange={(e) => set('ip', e.target.value)} />
            </label>
            <label className="field">
              <span>MAC</span>
              <input value={form.mac ?? ''} onChange={(e) => set('mac', e.target.value)} />
            </label>
            <label className="field">
              <span>Nº de puertos</span>
              <input
                type="number"
                value={form.num_puertos ?? ''}
                onChange={(e) => set('num_puertos', e.target.value ? Number(e.target.value) : null)}
              />
            </label>
            <label className="field">
              <span>Firmware</span>
              <input value={form.firmware ?? ''} onChange={(e) => set('firmware', e.target.value)} />
            </label>
            <label className="field">
              <span>Ubicación física</span>
              <input value={form.ubicacion_fisica ?? ''} onChange={(e) => set('ubicacion_fisica', e.target.value)} placeholder="Rack / cuarto técnico" />
            </label>
          </div>
          <label className="check-row">
            <input type="checkbox" checked={form.poe} onChange={(e) => set('poe', e.target.checked)} />
            <span>PoE</span>
          </label>
          <label className="field">
            <span>Configuración / notas</span>
            <textarea value={form.config_notas ?? ''} onChange={(e) => set('config_notas', e.target.value)} rows={2} />
          </label>
        </>
      )}

      {form.categoria === 'periferico' && (
        <>
          <h4>Periférico</h4>
          <div className="form-grid">
            <label className="field">
              <span>Tipo</span>
              <select
                value={form.tipo_periferico ?? ''}
                onChange={(e) => set('tipo_periferico', (e.target.value || null) as DatosActivo['tipo_periferico'])}
              >
                <option value="">—</option>
                <option value="monitor">Monitor</option>
                <option value="impresora">Impresora</option>
                <option value="escaner">Escáner</option>
                <option value="ups">UPS</option>
                <option value="diadema">Diadema</option>
                <option value="camara">Cámara web</option>
                <option value="docking">Docking</option>
                <option value="proyector">Proyector</option>
                <option value="lector">Lector de código</option>
                <option value="otro">Otro</option>
              </select>
            </label>
            {form.tipo_periferico === 'monitor' && (
              <>
                <label className="field">
                  <span>Monitor: pulgadas</span>
                  <input value={form.monitor_pulgadas ?? ''} onChange={(e) => set('monitor_pulgadas', e.target.value)} />
                </label>
                <label className="field">
                  <span>Monitor: resolución</span>
                  <input value={form.monitor_resolucion ?? ''} onChange={(e) => set('monitor_resolucion', e.target.value)} />
                </label>
              </>
            )}
            {form.tipo_periferico === 'impresora' && (
              <>
                <label className="field">
                  <span>Impresora: tecnología</span>
                  <input value={form.impresora_tecnologia ?? ''} onChange={(e) => set('impresora_tecnologia', e.target.value)} placeholder="Láser / tinta" />
                </label>
                <label className="field">
                  <span>Impresora: conexión</span>
                  <input value={form.impresora_conexion ?? ''} onChange={(e) => set('impresora_conexion', e.target.value)} placeholder="USB / red" />
                </label>
              </>
            )}
          </div>
        </>
      )}

      <h4>Adquisición y garantía</h4>
      <div className="form-grid">
        <label className="field">
          <span>Fecha de adquisición</span>
          <input type="date" value={form.fecha_adquisicion ?? ''} onChange={(e) => set('fecha_adquisicion', e.target.value || null)} />
        </label>
        <label className="field">
          <span>Proveedor</span>
          <select
            value={form.proveedor_id ?? ''}
            onChange={(e) => set('proveedor_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">—</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Costo</span>
          <input value={form.costo ?? ''} onChange={(e) => set('costo', e.target.value)} />
        </label>
        <label className="field">
          <span>Orden de compra</span>
          <input value={form.orden_compra ?? ''} onChange={(e) => set('orden_compra', e.target.value)} />
        </label>
        <label className="field">
          <span>Factura</span>
          <input value={form.factura ?? ''} onChange={(e) => set('factura', e.target.value)} />
        </label>
        <label className="field">
          <span>Garantía: inicio</span>
          <input type="date" value={form.garantia_inicio ?? ''} onChange={(e) => set('garantia_inicio', e.target.value || null)} />
        </label>
        <label className="field">
          <span>Garantía: fin</span>
          <input type="date" value={form.garantia_fin ?? ''} onChange={(e) => set('garantia_fin', e.target.value || null)} />
        </label>
      </div>

      <label className="field">
        <span>Observaciones</span>
        <textarea value={form.observaciones ?? ''} onChange={(e) => set('observaciones', e.target.value)} rows={2} />
      </label>
      </div>

      <div className="modal-actions" style={{ marginTop: 12 }}>
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

// --- Modal de dar de baja --------------------------------------------------

const MOTIVOS: MotivoBaja[] = ['obsolescencia', 'danio', 'perdida', 'robo', 'donacion', 'venta']

function BajaForm({
  activo,
  onConfirmar,
  onError,
  onCancelar,
}: {
  activo: Activo
  onConfirmar: (motivo: MotivoBaja, autorizado: string, acta: string) => Promise<void>
  onError: (msg: string) => void
  onCancelar: () => void
}) {
  const [motivo, setMotivo] = useState<MotivoBaja>('obsolescencia')
  const [autorizado, setAutorizado] = useState('')
  const [acta, setActa] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      await onConfirmar(motivo, autorizado.trim(), acta.trim())
    } catch (err) {
      onError(detalleError(err, 'No se pudo dar de baja el activo.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h3>Dar de baja — {activo.codigo_interno}</h3>
      <p className="muted">El activo pasará a estado “Dado de baja” y saldrá del inventario activo.</p>
      <div className="form-grid">
        <label className="field">
          <span>Motivo *</span>
          <select value={motivo} onChange={(e) => setMotivo(e.target.value as MotivoBaja)}>
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>
                {ETIQUETA_MOTIVO_BAJA[m]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Autorizado por</span>
          <input value={autorizado} onChange={(e) => setAutorizado(e.target.value)} />
        </label>
        <label className="field">
          <span>Acta (referencia)</span>
          <input value={acta} onChange={(e) => setActa(e.target.value)} />
        </label>
      </div>
      <div className="modal-actions" style={{ marginTop: 8 }}>
        <button type="button" className="btn-ghost" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando ? 'Procesando…' : 'Confirmar baja'}
        </button>
      </div>
    </form>
  )
}

// --- Mantenimientos (bitácora) + Hoja de Vida ----------------------------

const TIPOS_MANT: TipoMantenimiento[] = ['verificacion', 'preventivo', 'correctivo', 'seguimiento']

function MantenimientoModal({
  activo,
  puedeEditar,
  onError,
  onMensaje,
  onCerrar,
}: {
  activo: Activo
  puedeEditar: boolean
  onError: (msg: string) => void
  onMensaje: (msg: string) => void
  onCerrar: () => void
}) {
  const [items, setItems] = useState<Mantenimiento[]>([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState<DatosMantenimiento>({
    tipo: 'preventivo',
    fecha: new Date().toISOString().slice(0, 10),
    responsable: '',
    descripcion: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [hvPreview, setHvPreview] = useState<string | null>(null)
  const [hvGen, setHvGen] = useState(false)
  const [hvSave, setHvSave] = useState(false)

  async function cargar() {
    setItems(await listarMantenimientos(activo.id))
  }

  useEffect(() => {
    cargar()
      .catch((err) => onError(detalleError(err, 'No se pudo cargar la bitácora.')))
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function registrar() {
    setGuardando(true)
    try {
      await registrarMantenimiento(activo.id, form)
      setForm((f) => ({ ...f, descripcion: '' }))
      await cargar()
    } catch (err) {
      onError(detalleError(err, 'No se pudo registrar el mantenimiento.'))
    } finally {
      setGuardando(false)
    }
  }

  async function borrar(id: number) {
    if (!window.confirm('¿Eliminar este mantenimiento?')) return
    try {
      await eliminarMantenimiento(activo.id, id)
      await cargar()
    } catch (err) {
      onError(detalleError(err, 'No se pudo eliminar.'))
    }
  }

  async function previsualizarHV() {
    setHvGen(true)
    try {
      setHvPreview(await previewHojaVida(activo.id))
    } catch (err) {
      onError(detalleError(err, 'No se pudo generar la Hoja de Vida.'))
    } finally {
      setHvGen(false)
    }
  }

  async function guardarHV() {
    setHvSave(true)
    try {
      await guardarHojaVida(activo.id)
      onMensaje('Hoja de Vida generada y guardada en los documentos del activo.')
    } catch (err) {
      onError(detalleError(err, 'No se pudo guardar la Hoja de Vida.'))
    } finally {
      setHvSave(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '82vh' }}>
      <h3 style={{ marginBottom: 8 }}>Mantenimientos — {activo.codigo_interno}</h3>

      <div style={{ overflowY: 'auto', flex: 1, paddingRight: 6 }}>
        {puedeEditar && (
          <>
            <h4>Registrar mantenimiento</h4>
            <div className="form-grid">
              <label className="field">
                <span>Tipo</span>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoMantenimiento }))}
                >
                  {TIPOS_MANT.map((t) => (
                    <option key={t} value={t}>
                      {ETIQUETA_TIPO_MANT[t]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Fecha</span>
                <input
                  type="date"
                  value={form.fecha ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value || null }))}
                />
              </label>
              <label className="field">
                <span>Responsable</span>
                <input
                  value={form.responsable ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, responsable: e.target.value }))}
                />
              </label>
              <label className="field" style={{ gridColumn: 'span 3' }}>
                <span>Descripción</span>
                <input
                  value={form.descripcion ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                />
              </label>
            </div>
            <button
              className="btn-primary"
              disabled={guardando}
              onClick={registrar}
              style={{ marginTop: 4 }}
            >
              {guardando ? 'Guardando…' : 'Agregar a la bitácora'}
            </button>
          </>
        )}

        <h4>Bitácora</h4>
        {cargando ? (
          <div className="muted">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="muted">Sin mantenimientos registrados.</div>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Responsable</th>
                <th>Descripción</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td>{m.fecha || '—'}</td>
                  <td>{ETIQUETA_TIPO_MANT[m.tipo]}</td>
                  <td>{m.responsable || '—'}</td>
                  <td>{m.descripcion || '—'}</td>
                  <td>
                    {puedeEditar && (
                      <button className="icon-btn" title="Eliminar" onClick={() => borrar(m.id)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h4>Hoja de Vida</h4>
        <p className="muted">
          Genera el PDF con los datos del equipo, su configuración y esta bitácora.
        </p>
        {hvPreview && (
          <iframe
            src={hvPreview}
            title="Hoja de Vida"
            style={{ width: '100%', height: 420, border: '1px solid var(--borde)', marginTop: 8 }}
          />
        )}
      </div>

      <div className="modal-actions" style={{ marginTop: 12 }}>
        <button className="btn-ghost" onClick={onCerrar}>
          Cerrar
        </button>
        <button className="btn-ghost" disabled={hvGen} onClick={previsualizarHV}>
          {hvGen ? 'Generando…' : 'Previsualizar Hoja de Vida'}
        </button>
        {puedeEditar && (
          <button className="btn-primary" disabled={hvSave} onClick={guardarHV}>
            {hvSave ? 'Guardando…' : 'Guardar Hoja de Vida'}
          </button>
        )}
      </div>
    </div>
  )
}
