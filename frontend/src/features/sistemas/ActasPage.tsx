import { Download, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'

import DataTable, { type Columna } from '../../shared/ui/DataTable'
import { type ActaItem, descargarActa, listarActas, urlDocumento } from './activosApi'
import { VisorPdfModal } from './VisorPdfModal'

export function ActasPage() {
  const [actas, setActas] = useState<ActaItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verUrl, setVerUrl] = useState<string | null>(null)

  useEffect(() => {
    listarActas()
      .then(setActas)
      .catch(() => setError('No se pudieron cargar las actas.'))
      .finally(() => setCargando(false))
  }, [])

  async function ver(a: ActaItem) {
    try {
      setVerUrl(await urlDocumento(a.activo_id, a.id))
    } catch {
      setError('No se pudo abrir el acta.')
    }
  }

  const columnas: Columna<ActaItem>[] = [
    { id: 'activo', header: 'Activo', accessorFn: (a) => `${a.activo_codigo} — ${a.activo_nombre}` },
    { id: 'archivo', header: 'Archivo', accessorFn: (a) => a.nombre_archivo },
    { id: 'desc', header: 'Descripción', accessorFn: (a) => a.descripcion || '—' },
    { id: 'creado', header: 'Creado por', accessorFn: (a) => a.usuario?.nombre || '—' },
    {
      id: 'fecha',
      header: 'Fecha',
      accessorFn: (a) => new Date(a.created_at).toLocaleDateString(),
    },
    {
      id: 'acciones',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const a = row.original
        return (
          <>
            <button className="icon-btn" title="Ver" onClick={() => ver(a)}>
              <Eye size={16} />
            </button>
            <button
              className="icon-btn"
              title="Descargar"
              onClick={() => descargarActa(a.activo_id, a.id, a.nombre_archivo)}
            >
              <Download size={16} />
            </button>
          </>
        )
      },
    },
  ]

  return (
    <div className="card">
      {error && <div className="alert-error">{error}</div>}
      {cargando ? (
        <div className="muted">Cargando actas…</div>
      ) : actas.length === 0 ? (
        <div className="muted">
          Aún no hay actas generadas. Genera una desde el Inventario (icono 📋 en cada activo).
        </div>
      ) : (
        <DataTable columns={columnas} data={actas} title="Actas generadas" initialPageSize={15} />
      )}
      {verUrl && (
        <VisorPdfModal url={verUrl} titulo="Acta" onCerrar={() => setVerUrl(null)} />
      )}
    </div>
  )
}
