import { Eye } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import DataTable, { type Columna } from '../../shared/ui/DataTable'
import {
  ETIQUETA_TIPO_MANT,
  type MantenimientoItem,
  type TipoMantenimiento,
  listarMantenimientosGlobal,
  previewHojaVida,
} from './activosApi'
import { VisorPdfModal } from './VisorPdfModal'

const TIPOS: TipoMantenimiento[] = ['verificacion', 'preventivo', 'correctivo', 'seguimiento']

export function MantenimientosPage() {
  const [items, setItems] = useState<MantenimientoItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fTipo, setFTipo] = useState<TipoMantenimiento | ''>('')
  const [texto, setTexto] = useState('')
  const [verUrl, setVerUrl] = useState<string | null>(null)

  async function verHojaVida(m: MantenimientoItem) {
    try {
      setVerUrl(await previewHojaVida(m.activo_id))
    } catch {
      setError('No se pudo abrir la Hoja de Vida.')
    }
  }

  useEffect(() => {
    listarMantenimientosGlobal()
      .then(setItems)
      .catch(() => setError('No se pudieron cargar los mantenimientos.'))
      .finally(() => setCargando(false))
  }, [])

  const filtrados = useMemo(
    () =>
      items.filter(
        (m) =>
          (!fTipo || m.tipo === fTipo) &&
          (!texto ||
            `${m.activo_codigo} ${m.activo_nombre} ${m.responsable ?? ''} ${m.descripcion ?? ''}`
              .toLowerCase()
              .includes(texto.toLowerCase())),
      ),
    [items, fTipo, texto],
  )

  const columnas: Columna<MantenimientoItem>[] = [
    { id: 'activo', header: 'Activo', accessorFn: (m) => `${m.activo_codigo} — ${m.activo_nombre}` },
    { id: 'fecha', header: 'Fecha', accessorFn: (m) => m.fecha || '—' },
    { id: 'tipo', header: 'Tipo', accessorFn: (m) => ETIQUETA_TIPO_MANT[m.tipo] },
    { id: 'resp', header: 'Responsable', accessorFn: (m) => m.responsable || '—' },
    { id: 'desc', header: 'Descripción', accessorFn: (m) => m.descripcion || '—' },
    {
      id: 'acciones',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <button
          className="icon-btn"
          title="Ver Hoja de Vida"
          onClick={() => verHojaVida(row.original)}
        >
          <Eye size={16} />
        </button>
      ),
    },
  ]

  return (
    <div className="stack">
      <div className="card">
        <div className="form-grid">
          <label className="field">
            <span>Buscar</span>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Activo, responsable, descripción…"
            />
          </label>
          <label className="field">
            <span>Tipo</span>
            <select value={fTipo} onChange={(e) => setFTipo(e.target.value as TipoMantenimiento | '')}>
              <option value="">Todos</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {ETIQUETA_TIPO_MANT[t]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="card">
        {error && <div className="alert-error">{error}</div>}
        {cargando ? (
          <div className="muted">Cargando…</div>
        ) : filtrados.length === 0 ? (
          <div className="muted">
            Sin mantenimientos. Regístralos desde el Inventario (icono 🔧 en cada activo).
          </div>
        ) : (
          <DataTable columns={columnas} data={filtrados} title="Mantenimientos" initialPageSize={15} />
        )}
        {verUrl && (
          <VisorPdfModal url={verUrl} titulo="Hoja de Vida" onCerrar={() => setVerUrl(null)} />
        )}
      </div>
    </div>
  )
}
