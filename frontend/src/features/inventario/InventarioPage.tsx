import { Pencil, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import {
  CLASES_BIOMEDICAS,
  CLASES_USO,
  type Equipo,
  ESTADOS,
  etiquetaPropiedad,
  FUENTES_ALIMENTACION,
  MANUALES_OPCIONES,
  MODOS_ADQUISICION,
  PLANOS_OPCIONES,
  PROPIEDADES,
  RIESGOS,
  TECNOLOGIAS,
} from '../../entities/equipo'
import type { Proveedor } from '../../entities/proveedor'
import type { Sede } from '../../entities/sede'
import type { Servicio } from '../../entities/servicio'
import { useAuth } from '../../shared/auth/AuthContext'
import { type Columna, DataTable } from '../../shared/ui/DataTable'
import { MultiSelect } from '../../shared/ui/MultiSelect'
import {
  actualizarEquipo,
  crearEquipo,
  type DatosEquipo,
  descargarPlantilla,
  eliminarEquipo,
  eliminarFotoEquipo,
  type FiltroEquipos,
  importarEquipos,
  listarEquipos,
  obtenerFotoUrl,
  type ResultadoImportacion,
  subirFotoEquipo,
} from './equiposApi'
import { listarProveedores } from './proveedoresApi'
import { listarSedes } from './sedesApi'
import { listarServicios } from './serviciosApi'

function detalleError(err: unknown, porDefecto: string): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    porDefecto
  )
}

export function InventarioPage() {
  const { puede } = useAuth()
  const puedeCrear = puede('inventario:crear')
  const puedeEditar = puede('inventario:editar')
  const puedeEliminar = puede('inventario:eliminar')

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [filtros, setFiltros] = useState<FiltroEquipos>({})
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [editando, setEditando] = useState<Equipo | 'nuevo' | null>(null)
  const [importar, setImportar] = useState(false)

  async function cargarEquipos(f: FiltroEquipos = filtros) {
    setEquipos(await listarEquipos(f))
  }

  useEffect(() => {
    ;(async () => {
      try {
        const [eq, sd, sv, pr] = await Promise.all([
          listarEquipos(),
          listarSedes(),
          listarServicios(),
          listarProveedores(),
        ])
        setEquipos(eq)
        setSedes(sd)
        setServicios(sv)
        setProveedores(pr)
      } catch (err) {
        setError(detalleError(err, 'No se pudo cargar el inventario.'))
      } finally {
        setCargando(false)
      }
    })()
  }, [])

  function aplicar(cambio: Partial<FiltroEquipos>) {
    const nuevos = { ...filtros, ...cambio }
    setFiltros(nuevos)
    cargarEquipos(nuevos).catch((err) =>
      setError(detalleError(err, 'Error al filtrar.')),
    )
  }

  function buscarTexto(e: FormEvent) {
    e.preventDefault()
    aplicar({ texto: texto.trim() || undefined })
  }

  async function borrar(eq: Equipo) {
    if (!window.confirm(`¿Eliminar el equipo "${eq.nombre}" (${eq.codigo_interno})?`))
      return
    setError(null)
    setMensaje(null)
    try {
      await eliminarEquipo(eq.id)
      await cargarEquipos()
      setMensaje('Equipo eliminado.')
    } catch (err) {
      setError(detalleError(err, 'No se pudo eliminar el equipo.'))
    }
  }

  if (cargando) return <div className="muted">Cargando inventario…</div>

  const columnas: Columna<Equipo>[] = [
    { header: 'Cod', celda: (e) => e.codigo_interno },
    { header: 'Nombre', celda: (e) => e.nombre },
    { header: 'Marca', celda: (e) => e.marca || '—' },
    { header: 'Modelo', celda: (e) => e.modelo || '—' },
    { header: 'Serial', celda: (e) => e.serial_fabricante },
    { header: 'N° activo', celda: (e) => e.numero_activo || '—' },
    {
      header: 'Ubicación',
      celda: (e) => (
        <div className="celda-ubic">
          <span>{e.sede_nombre || '—'}</span>
          {(e.servicio_nombre || e.piso) && (
            <span className="muted small">
              {e.servicio_nombre || '—'}
              {e.piso ? ` · Piso ${e.piso}` : ''}
            </span>
          )}
        </div>
      ),
    },
    { header: 'Clase biomédica', celda: (e) => e.clase_biomedica || '—' },
    { header: 'Riesgo', celda: (e) => e.clasificacion_riesgo || '—' },
    { header: 'INVIMA', celda: (e) => e.registro_invima || '—' },
    { header: 'Venc. INVIMA', celda: (e) => e.fecha_vencimiento_invima || '—' },
    { header: 'Propiedad', celda: (e) => etiquetaPropiedad(e.propiedad) },
    {
      header: '',
      ancho: 90,
      celda: (e) => (
        <>
          {puedeEditar && (
            <button
              className="icon-btn"
              title="Editar"
              onClick={() => {
                setError(null)
                setMensaje(null)
                setEditando(e)
              }}
            >
              <Pencil size={16} />
            </button>
          )}
          {puedeEliminar && (
            <button className="icon-btn" title="Eliminar" onClick={() => borrar(e)}>
              <Trash2 size={16} />
            </button>
          )}
        </>
      ),
    },
  ]

  return (
    <div className="stack">
      <div className="card">
        <div className="detail-head">
          <h2>Inventario de equipos biomédicos</h2>
          {puedeCrear && (
            <div className="acciones-head">
              <button className="btn-ghost" onClick={() => setImportar(true)}>
                Importar Excel
              </button>
              {sedes.length > 0 && (
                <button className="btn-primary" onClick={() => setEditando('nuevo')}>
                  + Registrar equipo
                </button>
              )}
            </div>
          )}
        </div>

        <form className="filtros" onSubmit={buscarTexto}>
          <input
            className="filtro-texto"
            placeholder="Buscar por nombre, código, serial, marca o activo…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <select
            value={filtros.sede_id ?? ''}
            onChange={(e) =>
              aplicar({ sede_id: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            <option value="">Todas las sedes</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          <select
            value={filtros.estado ?? ''}
            onChange={(e) => aplicar({ estado: (e.target.value || undefined) as never })}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filtros.clasificacion_riesgo ?? ''}
            onChange={(e) =>
              aplicar({ clasificacion_riesgo: (e.target.value || undefined) as never })
            }
          >
            <option value="">Todo riesgo</option>
            {RIESGOS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <select
            value={filtros.propiedad ?? ''}
            onChange={(e) => aplicar({ propiedad: (e.target.value || undefined) as never })}
          >
            <option value="">Toda propiedad</option>
            {PROPIEDADES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <button className="btn-ghost" type="submit">
            Buscar
          </button>
        </form>

        {mensaje && <div className="alert-ok">{mensaje}</div>}
        {error && <div className="alert-error">{error}</div>}
        {puedeCrear && sedes.length === 0 && (
          <div className="aviso" style={{ marginTop: 12 }}>
            Registra una <strong>sede</strong> antes de crear equipos.
          </div>
        )}

        <DataTable
          className="tabla-compacta"
          columnas={columnas}
          filas={equipos}
          keyOf={(e) => e.id}
          porPagina={50}
          vacio="No hay equipos que coincidan."
        />
      </div>

      {editando && (
        <div className="modal-overlay" onClick={() => setEditando(null)}>
          <div className="modal card modal-ancho" onClick={(e) => e.stopPropagation()}>
            <EquipoForm
              inicial={editando === 'nuevo' ? undefined : editando}
              sedes={sedes}
              servicios={servicios}
              proveedores={proveedores}
              onGuardar={(datos) =>
                editando === 'nuevo'
                  ? crearEquipo(datos)
                  : actualizarEquipo(editando.id, datos)
              }
              onFinalizado={async (msg) => {
                setMensaje(msg)
                setEditando(null)
                await cargarEquipos()
              }}
              onError={setError}
              onCancelar={() => setEditando(null)}
            />
          </div>
        </div>
      )}

      {importar && (
        <ImportarModal
          onCerrar={() => setImportar(false)}
          onImportado={async (r) => {
            await cargarEquipos()
            if (r.creados > 0) setMensaje(`${r.creados} equipo(s) importado(s).`)
          }}
        />
      )}
    </div>
  )
}

function ImportarModal({
  onCerrar,
  onImportado,
}: {
  onCerrar: () => void
  onImportado: (r: ResultadoImportacion) => void | Promise<void>
}) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function importar() {
    if (!archivo) return
    setSubiendo(true)
    setError(null)
    try {
      const r = await importarEquipos(archivo)
      setResultado(r)
      await onImportado(r)
    } catch (err) {
      setError(detalleError(err, 'No se pudo importar el archivo.'))
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3>Importar equipos desde Excel</h3>
        <p className="muted small">
          Descarga la plantilla, complétala y súbela. En los campos de selección
          múltiple separa los valores con punto y coma (;). Las filas con error se
          reportan y no detienen a las demás.
        </p>

        <button
          type="button"
          className="btn-ghost"
          onClick={() =>
            descargarPlantilla().catch(() => setError('No se pudo descargar la plantilla.'))
          }
        >
          ⬇ Descargar plantilla
        </button>

        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => {
            setArchivo(e.target.files?.[0] ?? null)
            setResultado(null)
          }}
        />

        {error && <div className="alert-error">{error}</div>}

        {resultado && (
          <div className={resultado.errores.length ? 'alert-error' : 'alert-ok'}>
            Procesadas: {resultado.total} · Creadas: {resultado.creados} · Con error:{' '}
            {resultado.errores.length}
          </div>
        )}
        {resultado && resultado.errores.length > 0 && (
          <div className="tabla-wrap" style={{ maxHeight: 200, overflowY: 'auto' }}>
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {resultado.errores.map((e) => (
                  <tr key={e.fila}>
                    <td>{e.fila}</td>
                    <td>{e.mensaje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCerrar}>
            Cerrar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!archivo || subiendo}
            onClick={importar}
          >
            {subiendo ? 'Importando…' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function estadoInicial(inicial?: Equipo): DatosEquipo {
  return {
    codigo_interno: inicial?.codigo_interno ?? '',
    serial_fabricante: inicial?.serial_fabricante ?? '',
    nombre: inicial?.nombre ?? '',
    estado: inicial?.estado ?? 'operativo',
    marca: inicial?.marca ?? null,
    modelo: inicial?.modelo ?? null,
    numero_activo: inicial?.numero_activo ?? null,
    sede_id: inicial?.sede_id ?? null,
    servicio_id: inicial?.servicio_id ?? null,
    piso: inicial?.piso ?? null,
    clase_biomedica: inicial?.clase_biomedica ?? null,
    clase_uso: inicial?.clase_uso ?? null,
    clasificacion_riesgo: inicial?.clasificacion_riesgo ?? null,
    tecnologia_predominante: inicial?.tecnologia_predominante ?? null,
    fabricante: inicial?.fabricante ?? null,
    anio_fabricacion: inicial?.anio_fabricacion ?? null,
    pais_fabricante: inicial?.pais_fabricante ?? null,
    ciudad_fabricante: inicial?.ciudad_fabricante ?? null,
    direccion_fabricante: inicial?.direccion_fabricante ?? null,
    telefono_fabricante: inicial?.telefono_fabricante ?? null,
    correo_fabricante: inicial?.correo_fabricante ?? null,
    representante: inicial?.representante ?? null,
    pais_representante: inicial?.pais_representante ?? null,
    ciudad_representante: inicial?.ciudad_representante ?? null,
    direccion_representante: inicial?.direccion_representante ?? null,
    telefono_representante: inicial?.telefono_representante ?? null,
    correo_representante: inicial?.correo_representante ?? null,
    voltaje_operacion: inicial?.voltaje_operacion ?? null,
    voltaje_maximo: inicial?.voltaje_maximo ?? null,
    corriente_maxima: inicial?.corriente_maxima ?? null,
    corriente_minima: inicial?.corriente_minima ?? null,
    potencia_consumida: inicial?.potencia_consumida ?? null,
    frecuencia: inicial?.frecuencia ?? null,
    presion: inicial?.presion ?? null,
    velocidad: inicial?.velocidad ?? null,
    temperatura: inicial?.temperatura ?? null,
    peso: inicial?.peso ?? null,
    capacidad: inicial?.capacidad ?? null,
    fuentes_alimentacion: inicial?.fuentes_alimentacion ?? [],
    manuales: inicial?.manuales ?? [],
    planos: inicial?.planos ?? [],
    recomendaciones_fabricante: inicial?.recomendaciones_fabricante ?? [],
    modo_adquisicion: inicial?.modo_adquisicion ?? null,
    propiedad: inicial?.propiedad ?? null,
    proveedor_id: inicial?.proveedor_id ?? null,
    fecha_adquisicion: inicial?.fecha_adquisicion ?? null,
    costo_adquisicion:
      inicial?.costo_adquisicion != null ? String(inicial.costo_adquisicion) : null,
    orden_compra: inicial?.orden_compra ?? null,
    fecha_inicial_garantia: inicial?.fecha_inicial_garantia ?? null,
    fecha_final_garantia: inicial?.fecha_final_garantia ?? null,
    fecha_instalacion: inicial?.fecha_instalacion ?? null,
    fecha_funcionamiento: inicial?.fecha_funcionamiento ?? null,
    registro_invima: inicial?.registro_invima ?? null,
    fecha_vencimiento_invima: inicial?.fecha_vencimiento_invima ?? null,
    periodicidad_mantenimiento: inicial?.periodicidad_mantenimiento ?? null,
    calibracion_si: inicial?.calibracion_si ?? false,
    calibracion_no: inicial?.calibracion_no ?? false,
    equipo_movil: inicial?.equipo_movil ?? false,
    equipo_fijo: inicial?.equipo_fijo ?? false,
    accesorios: inicial?.accesorios ?? null,
    descripcion_funcional: inicial?.descripcion_funcional ?? null,
  }
}

// Campos de texto simple por sección (clave -> etiqueta).
const CAMPOS_FABRICANTE: [keyof DatosEquipo, string][] = [
  ['fabricante', 'Fabricante'],
  ['pais_fabricante', 'País'],
  ['ciudad_fabricante', 'Ciudad'],
  ['direccion_fabricante', 'Dirección'],
  ['telefono_fabricante', 'Teléfono'],
  ['correo_fabricante', 'Correo'],
]
const CAMPOS_REPRESENTANTE: [keyof DatosEquipo, string][] = [
  ['representante', 'Representante'],
  ['pais_representante', 'País'],
  ['ciudad_representante', 'Ciudad'],
  ['direccion_representante', 'Dirección'],
  ['telefono_representante', 'Teléfono'],
  ['correo_representante', 'Correo'],
]
const CAMPOS_TECNICOS: [keyof DatosEquipo, string][] = [
  ['voltaje_operacion', 'Voltaje de operación'],
  ['voltaje_maximo', 'Voltaje máximo'],
  ['corriente_maxima', 'Corriente máxima'],
  ['corriente_minima', 'Corriente mínima'],
  ['potencia_consumida', 'Potencia consumida'],
  ['frecuencia', 'Frecuencia'],
  ['presion', 'Presión'],
  ['velocidad', 'Velocidad'],
  ['temperatura', 'Temperatura'],
  ['peso', 'Peso'],
  ['capacidad', 'Capacidad'],
]

function EquipoForm({
  inicial,
  sedes,
  servicios,
  proveedores,
  onGuardar,
  onFinalizado,
  onError,
  onCancelar,
}: {
  inicial?: Equipo
  sedes: Sede[]
  servicios: Servicio[]
  proveedores: Proveedor[]
  onGuardar: (datos: DatosEquipo) => Promise<Equipo>
  onFinalizado: (mensaje: string) => Promise<void> | void
  onError: (msg: string) => void
  onCancelar: () => void
}) {
  const [f, setF] = useState<DatosEquipo>(() => estadoInicial(inicial))
  const [guardando, setGuardando] = useState(false)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoQuitar, setFotoQuitar] = useState(false)

  // Carga la foto existente (si la hay) para previsualizarla al editar.
  useEffect(() => {
    if (inicial?.id && inicial.foto_mime) {
      obtenerFotoUrl(inicial.id).then((url) => {
        if (url) setFotoPreview(url)
      })
    }
  }, [inicial])

  function elegirFoto(file: File | null) {
    setFotoFile(file)
    setFotoQuitar(false)
    setFotoPreview(file ? URL.createObjectURL(file) : null)
  }

  function quitarFoto() {
    setFotoFile(null)
    setFotoPreview(null)
    setFotoQuitar(true)
  }

  function set<K extends keyof DatosEquipo>(campo: K, valor: DatosEquipo[K]) {
    setF((prev) => ({ ...prev, [campo]: valor }))
  }

  const serviciosDeSede = servicios.filter((s) => s.sede_id === f.sede_id)
  const txt = (v: string | null) => v ?? ''

  // Campo de texto enlazado a una clave string|null del formulario.
  // Se llama como función (no como <Componente/>) para no remontar el input.
  const campoTexto = (campo: keyof DatosEquipo, label: string) => (
    <label className="field" key={campo}>
      <span>{label}</span>
      <input
        value={txt(f[campo] as string | null)}
        onChange={(e) => set(campo, (e.target.value || null) as never)}
      />
    </label>
  )

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      const guardado = await onGuardar({
        ...f,
        codigo_interno: f.codigo_interno.trim(),
        serial_fabricante: f.serial_fabricante.trim(),
        nombre: f.nombre.trim(),
        recomendaciones_fabricante: f.recomendaciones_fabricante
          .map((r) => r.trim())
          .filter(Boolean),
      })
      // Segundo paso: gestionar la foto ya con el id del equipo.
      if (fotoFile) {
        await subirFotoEquipo(guardado.id, fotoFile)
      } else if (fotoQuitar && inicial?.foto_mime) {
        await eliminarFotoEquipo(guardado.id)
      }
      await onFinalizado(inicial ? 'Equipo actualizado.' : 'Equipo registrado.')
    } catch (err) {
      onError(detalleError(err, 'No se pudo guardar el equipo.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h3>{inicial ? 'Editar equipo' : 'Registrar equipo'}</h3>

      <h4 className="grupo-tit">Identificación</h4>
      <div className="form-grid">
        <label className="field">
          <span>Código interno {inicial ? '*' : ''}</span>
          <input
            value={f.codigo_interno ?? ''}
            onChange={(e) => set('codigo_interno', e.target.value)}
            required={Boolean(inicial)}
            placeholder={inicial ? '' : 'Automático (EQ-0001) si lo dejas vacío'}
          />
        </label>
        <label className="field">
          <span>Serial del fabricante *</span>
          <input
            value={f.serial_fabricante}
            onChange={(e) => set('serial_fabricante', e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Nombre *</span>
          <input
            value={f.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            required
            minLength={2}
          />
        </label>
        {campoTexto('marca', 'Marca')}
        {campoTexto('modelo', 'Modelo')}
        {campoTexto('numero_activo', 'N° de activo (placa)')}
        <label className="field">
          <span>Estado</span>
          <select value={f.estado} onChange={(e) => set('estado', e.target.value as never)}>
            {ESTADOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="foto-field">
        <div className="foto-preview">
          {fotoPreview ? (
            <img src={fotoPreview} alt="Foto del equipo" />
          ) : (
            <span className="muted small">Sin foto</span>
          )}
        </div>
        <div className="foto-acciones">
          <span className="field-label">Foto del equipo</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => elegirFoto(e.target.files?.[0] ?? null)}
          />
          {fotoPreview && (
            <button type="button" className="btn-ghost" onClick={quitarFoto}>
              Quitar foto
            </button>
          )}
          <span className="muted small">JPG, PNG o WEBP · máx. 5 MB</span>
        </div>
      </div>

      <h4 className="grupo-tit">Ubicación</h4>
      <div className="form-grid">
        <label className="field">
          <span>Sede</span>
          <select
            value={f.sede_id ?? ''}
            onChange={(e) => {
              const sede = e.target.value ? Number(e.target.value) : null
              setF((prev) => ({ ...prev, sede_id: sede, servicio_id: null }))
            }}
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
          <span>Servicio</span>
          <select
            value={f.servicio_id ?? ''}
            onChange={(e) => set('servicio_id', e.target.value ? Number(e.target.value) : null)}
            disabled={!f.sede_id}
          >
            <option value="">—</option>
            {serviciosDeSede.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        {campoTexto('piso', 'Piso')}
      </div>

      <h4 className="grupo-tit">Clasificación</h4>
      <div className="form-grid">
        <label className="field">
          <span>Clase biomédica</span>
          <select
            value={txt(f.clase_biomedica)}
            onChange={(e) => set('clase_biomedica', e.target.value || null)}
          >
            <option value="">—</option>
            {CLASES_BIOMEDICAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Clase de uso</span>
          <select
            value={txt(f.clase_uso)}
            onChange={(e) => set('clase_uso', e.target.value || null)}
          >
            <option value="">—</option>
            {CLASES_USO.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Clasificación según riesgo</span>
          <select
            value={txt(f.clasificacion_riesgo)}
            onChange={(e) => set('clasificacion_riesgo', (e.target.value || null) as never)}
          >
            <option value="">—</option>
            {RIESGOS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Tecnología predominante</span>
          <select
            value={txt(f.tecnologia_predominante)}
            onChange={(e) => set('tecnologia_predominante', e.target.value || null)}
          >
            <option value="">—</option>
            {TECNOLOGIAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h4 className="grupo-tit">Fabricante</h4>
      <div className="form-grid">
        {campoTexto('fabricante', 'Fabricante')}
        <label className="field">
          <span>Año de fabricación</span>
          <input
            type="number"
            min={1900}
            max={2100}
            value={f.anio_fabricacion ?? ''}
            onChange={(e) =>
              set('anio_fabricacion', e.target.value ? Number(e.target.value) : null)
            }
          />
        </label>
        {CAMPOS_FABRICANTE.slice(1).map(([campo, label]) => campoTexto(campo, label))}
      </div>

      <h4 className="grupo-tit">Representante</h4>
      <div className="form-grid">
        {CAMPOS_REPRESENTANTE.map(([campo, label]) => campoTexto(campo, label))}
      </div>

      <h4 className="grupo-tit">Especificaciones técnicas</h4>
      <div className="form-grid">
        {CAMPOS_TECNICOS.map(([campo, label]) => campoTexto(campo, label))}
      </div>
      <label className="field">
        <span>Fuente de alimentación</span>
        <MultiSelect
          opciones={FUENTES_ALIMENTACION}
          seleccionadas={f.fuentes_alimentacion}
          onChange={(v) => set('fuentes_alimentacion', v)}
        />
      </label>

      <h4 className="grupo-tit">Documentación</h4>
      <div className="form-grid">
        <label className="field">
          <span>Manuales</span>
          <MultiSelect
            opciones={MANUALES_OPCIONES}
            seleccionadas={f.manuales}
            onChange={(v) => set('manuales', v)}
          />
        </label>
        <label className="field">
          <span>Planos</span>
          <MultiSelect
            opciones={PLANOS_OPCIONES}
            seleccionadas={f.planos}
            onChange={(v) => set('planos', v)}
          />
        </label>
      </div>
      <label className="field">
        <span>Recomendaciones del fabricante (una por línea)</span>
        <textarea
          rows={3}
          value={f.recomendaciones_fabricante.join('\n')}
          onChange={(e) => set('recomendaciones_fabricante', e.target.value.split('\n'))}
        />
      </label>

      <h4 className="grupo-tit">Adquisición y garantía</h4>
      <div className="form-grid">
        <label className="field">
          <span>Modo de adquisición</span>
          <select
            value={txt(f.modo_adquisicion)}
            onChange={(e) => set('modo_adquisicion', e.target.value || null)}
          >
            <option value="">—</option>
            {MODOS_ADQUISICION.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Propiedad</span>
          <select
            value={txt(f.propiedad)}
            onChange={(e) => set('propiedad', (e.target.value || null) as never)}
          >
            <option value="">—</option>
            {PROPIEDADES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Proveedor</span>
          <select
            value={f.proveedor_id ?? ''}
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
          <span>Fecha de adquisición</span>
          <input
            type="date"
            value={txt(f.fecha_adquisicion)}
            onChange={(e) => set('fecha_adquisicion', e.target.value || null)}
          />
        </label>
        <label className="field">
          <span>Costo</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={txt(f.costo_adquisicion)}
            onChange={(e) => set('costo_adquisicion', e.target.value || null)}
          />
        </label>
        {campoTexto('orden_compra', 'Orden de compra')}
        <label className="field">
          <span>Fecha inicial de garantía</span>
          <input
            type="date"
            value={txt(f.fecha_inicial_garantia)}
            onChange={(e) => set('fecha_inicial_garantia', e.target.value || null)}
          />
        </label>
        <label className="field">
          <span>Fecha final de garantía</span>
          <input
            type="date"
            value={txt(f.fecha_final_garantia)}
            onChange={(e) => set('fecha_final_garantia', e.target.value || null)}
          />
        </label>
      </div>

      <h4 className="grupo-tit">Instalación</h4>
      <div className="form-grid">
        <label className="field">
          <span>Fecha de instalación</span>
          <input
            type="date"
            value={txt(f.fecha_instalacion)}
            onChange={(e) => set('fecha_instalacion', e.target.value || null)}
          />
        </label>
        <label className="field">
          <span>Fecha de funcionamiento</span>
          <input
            type="date"
            value={txt(f.fecha_funcionamiento)}
            onChange={(e) => set('fecha_funcionamiento', e.target.value || null)}
          />
        </label>
      </div>

      <h4 className="grupo-tit">Registro sanitario (INVIMA)</h4>
      <div className="form-grid">
        {campoTexto('registro_invima', 'Registro INVIMA')}
        <label className="field">
          <span>Fecha de vencimiento INVIMA</span>
          <input
            type="date"
            value={txt(f.fecha_vencimiento_invima)}
            onChange={(e) => set('fecha_vencimiento_invima', e.target.value || null)}
          />
        </label>
      </div>

      <h4 className="grupo-tit">Mantenimiento y operación</h4>
      <div className="form-grid">
        {campoTexto('periodicidad_mantenimiento', 'Periodicidad de mantenimiento')}
      </div>
      <div className="form-grid">
        <label className="field-check">
          <input
            type="checkbox"
            checked={f.calibracion_si}
            onChange={(e) => set('calibracion_si', e.target.checked)}
          />
          <span>Calibración SÍ</span>
        </label>
        <label className="field-check">
          <input
            type="checkbox"
            checked={f.calibracion_no}
            onChange={(e) => set('calibracion_no', e.target.checked)}
          />
          <span>Calibración NO</span>
        </label>
        <label className="field-check">
          <input
            type="checkbox"
            checked={f.equipo_movil}
            onChange={(e) => set('equipo_movil', e.target.checked)}
          />
          <span>Equipo móvil</span>
        </label>
        <label className="field-check">
          <input
            type="checkbox"
            checked={f.equipo_fijo}
            onChange={(e) => set('equipo_fijo', e.target.checked)}
          />
          <span>Equipo fijo</span>
        </label>
      </div>
      <label className="field">
        <span>Accesorios</span>
        <textarea
          rows={2}
          value={txt(f.accesorios)}
          onChange={(e) => set('accesorios', e.target.value || null)}
        />
      </label>
      <label className="field">
        <span>Descripción funcional</span>
        <textarea
          rows={2}
          value={txt(f.descripcion_funcional)}
          onChange={(e) => set('descripcion_funcional', e.target.value || null)}
        />
      </label>

      <div className="modal-actions">
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
