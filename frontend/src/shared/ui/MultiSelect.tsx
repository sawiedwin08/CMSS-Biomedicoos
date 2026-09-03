interface MultiSelectProps {
  opciones: string[]
  seleccionadas: string[]
  onChange: (valores: string[]) => void
}

/** Selección múltiple simple: un grupo de checkboxes con vocabulario fijo. */
export function MultiSelect({ opciones, seleccionadas, onChange }: MultiSelectProps) {
  function alternar(valor: string) {
    if (seleccionadas.includes(valor)) {
      onChange(seleccionadas.filter((v) => v !== valor))
    } else {
      onChange([...seleccionadas, valor])
    }
  }

  return (
    <div className="multiselect">
      {opciones.map((op) => (
        <label key={op} className="multiselect-op">
          <input
            type="checkbox"
            checked={seleccionadas.includes(op)}
            onChange={() => alternar(op)}
          />
          <span>{op}</span>
        </label>
      ))}
    </div>
  )
}
