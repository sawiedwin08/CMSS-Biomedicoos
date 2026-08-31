/** Convierte 'ingeniero_biomedico' -> 'Ingeniero Biomedico'. */
export function titulo(texto: string | null | undefined): string {
  if (!texto) return ''
  return texto
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
