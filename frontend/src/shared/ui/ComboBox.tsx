import { useState } from 'react'

/**
 * Campo de texto con sugerencias: al escribir filtra las opciones que coinciden
 * (máximo `maxVisible` visibles, el resto con scroll) y permite texto libre.
 */
export function ComboBox({
  value,
  onChange,
  options,
  placeholder,
  maxVisible = 5,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  maxVisible?: number
}) {
  const [open, setOpen] = useState(false)
  const filtro = value.trim().toLowerCase()
  const visibles = filtro
    ? options.filter((o) => o.toLowerCase().includes(filtro))
    : options

  return (
    <div className="select-scroll">
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {open && visibles.length > 0 && (
        <div className="select-scroll-panel" style={{ maxHeight: maxVisible * 40 }}>
          {visibles.map((o) => (
            <button
              key={o}
              type="button"
              className={`select-scroll-opt${o === value ? ' sel' : ''}`}
              // onMouseDown evita que el input pierda el foco antes de elegir.
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(o)
                setOpen(false)
              }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
