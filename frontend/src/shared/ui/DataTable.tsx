import { type ReactNode, useEffect, useState } from 'react'

export interface Columna<T> {
  header: ReactNode
  celda: (fila: T) => ReactNode
  ancho?: number | string
  alinear?: 'left' | 'right' | 'center'
}

interface Props<T> {
  columnas: Columna<T>[]
  filas: T[]
  keyOf: (fila: T) => string | number
  porPagina?: number
  vacio?: ReactNode
  className?: string
}

/** Tabla estándar del sistema: encabezados, filas, paginación y estado vacío. */
export function DataTable<T>({
  columnas,
  filas,
  keyOf,
  porPagina = 15,
  vacio = 'Sin registros.',
  className,
}: Props<T>) {
  const [pagina, setPagina] = useState(1)
  const total = filas.length
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))

  // Si cambia el conjunto (filtros, borrados), reajusta la página actual.
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas)
  }, [pagina, totalPaginas])

  const inicio = (pagina - 1) * porPagina
  const visibles = filas.slice(inicio, inicio + porPagina)

  return (
    <div className={className}>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead>
            <tr>
              {columnas.map((c, i) => (
                <th key={i} style={{ width: c.ancho, textAlign: c.alinear }}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="muted">
                  {vacio}
                </td>
              </tr>
            ) : (
              visibles.map((fila) => (
                <tr key={keyOf(fila)}>
                  {columnas.map((c, i) => (
                    <td key={i} style={{ textAlign: c.alinear }}>
                      {c.celda(fila)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="dt-footer">
          <span className="muted small">
            Mostrando {inicio + 1}–{Math.min(inicio + porPagina, total)} de {total}
          </span>
          {totalPaginas > 1 && (
            <div className="dt-pager">
              <button
                className="btn-ghost"
                disabled={pagina === 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
              >
                ‹ Anterior
              </button>
              <span className="small">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                className="btn-ghost"
                disabled={pagina === totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              >
                Siguiente ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
