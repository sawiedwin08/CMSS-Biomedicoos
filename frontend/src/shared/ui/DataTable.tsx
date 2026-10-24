import { type ReactNode, useState } from 'react'
import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Search,
} from 'lucide-react'

// Alineación y estilo opcional por columna (vía `meta`).
export interface ColumnaMeta {
  /** Alineación horizontal del contenido y la cabecera. */
  align?: 'left' | 'center' | 'right'
  /** Tipografía monoespaciada/tabular (códigos, seriales, fechas). */
  mono?: boolean
  /** Trunca el texto con "…" en una sola línea (muestra el valor completo en tooltip). */
  truncate?: boolean
  /** Congela la columna pegada al borde derecho (siempre visible aunque haya scroll). */
  stickyRight?: boolean
}

// Definición de columnas abierta para cualquier tipo de fila.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Columna<T> = ColumnDef<T, any> & { meta?: ColumnaMeta }

export interface DataTableProps<T> {
  columns: Columna<T>[]
  data: T[]
  title?: ReactNode
  /** Muestra checkboxes de selección por fila. */
  enableSelection?: boolean
  /** Muestra el buscador global. */
  enableSearch?: boolean
  /** Acciones a la derecha del toolbar; recibe las filas seleccionadas. */
  toolbarActions?: (selectedRows: T[]) => ReactNode
  /** Filas por página inicial (default 10). */
  initialPageSize?: number
  /** Arranca en modo compacto (filas más densas). */
  initialDense?: boolean
  // --- Paginación server-side (opcional) ---
  manualPagination?: boolean
  pageCount?: number
  pagination?: PaginationState
  onPaginationChange?: (next: PaginationState) => void
  totalRows?: number
  onRowClick?: (row: T) => void
}

/**
 * Tabla reutilizable para todo el proyecto (TanStack Table).
 * Ordenamiento, búsqueda global, paginación (cliente o servidor) y selección.
 */
export default function DataTable<T>({
  columns,
  data,
  title,
  enableSelection = false,
  enableSearch = true,
  toolbarActions,
  initialPageSize = 10,
  initialDense = false,
  manualPagination = false,
  pageCount,
  pagination,
  onPaginationChange,
  totalRows,
  onRowClick,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [dense, setDense] = useState(initialDense)
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  const paginationState = manualPagination && pagination ? pagination : internalPagination

  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === 'function' ? updater(paginationState) : updater
    if (manualPagination) onPaginationChange?.(next)
    else setInternalPagination(next)
  }

  const selectionColumn: Columna<T> = {
    id: '__select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        ref={(el) => {
          if (el)
            el.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
        }}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    enableSorting: false,
    size: 36,
  }

  const table = useReactTable({
    data,
    columns: enableSelection ? [selectionColumn, ...columns] : columns,
    state: { sorting, rowSelection, globalFilter, pagination: paginationState },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
    enableRowSelection: enableSelection,
  })

  const totalCount = manualPagination
    ? totalRows ?? 0
    : table.getFilteredRowModel().rows.length

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original)
  const numSelected = selectedRows.length

  return (
    <div className="dt">
      <div className={`dt-toolbar ${numSelected > 0 ? 'dt-toolbar-selected' : ''}`}>
        <div className="dt-toolbar-left">
          {numSelected > 0 ? (
            <span className="dt-selected-count">{numSelected} seleccionado(s)</span>
          ) : (
            title != null && <span className="dt-title">{title}</span>
          )}
        </div>

        <div className="dt-toolbar-right">
          {enableSearch && numSelected === 0 && (
            <div className="dt-search">
              <Search size={15} />
              <input
                placeholder="Buscar…"
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
          )}
          {toolbarActions && toolbarActions(selectedRows)}
        </div>
      </div>

      <div className="dt-scroll">
        <table className={`dt-table ${dense ? 'dt-dense' : ''}`}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  const meta = (header.column.columnDef.meta ?? {}) as ColumnaMeta
                  const align = meta.align ?? 'left'
                  return (
                    <th
                      key={header.id}
                      style={{
                        width: header.getSize() !== 150 ? header.getSize() : undefined,
                        textAlign: align,
                      }}
                      className={`${canSort ? 'dt-sortable' : ''} dt-al-${align} ${
                        meta.stickyRight ? 'dt-sticky-right' : ''
                      }`}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="dt-th-inner">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="dt-sort-icon">
                            {sorted === 'asc' ? (
                              <ChevronUp size={14} />
                            ) : sorted === 'desc' ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronsUpDown size={14} className="dt-sort-idle" />
                            )}
                          </span>
                        )}
                      </span>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td className="dt-empty" colSpan={table.getAllColumns().length}>
                  Sin resultados
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`${row.getIsSelected() ? 'dt-row-selected' : ''} ${
                    onRowClick ? 'dt-row-click' : ''
                  }`}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = (cell.column.columnDef.meta ?? {}) as ColumnaMeta
                    const align = meta.align ?? 'left'
                    const clases = [
                      `dt-al-${align}`,
                      meta.mono ? 'dt-mono' : '',
                      meta.truncate ? 'dt-truncate' : '',
                      meta.stickyRight ? 'dt-sticky-right' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                    // Tooltip con el valor completo cuando se trunca.
                    const titulo =
                      meta.truncate && typeof cell.getValue() === 'string'
                        ? (cell.getValue() as string)
                        : undefined
                    return (
                      <td key={cell.id} className={clases} title={titulo}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="dt-footer">
        <label className="dt-dense-toggle">
          <input type="checkbox" checked={dense} onChange={(e) => setDense(e.target.checked)} />
          Compacto
        </label>

        <div className="dt-pagination">
          <span>
            {totalCount === 0
              ? 0
              : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            {'–'}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              totalCount,
            )}{' '}
            de {totalCount}
          </span>

          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / pág
              </option>
            ))}
          </select>

          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft size={16} />
          </button>
          <span className="dt-page-num">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
