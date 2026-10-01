const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  // es-ES no agrupa números de 4 cifras por defecto (1234 € -> 1.234 €)
  useGrouping: 'always',
})

export function formatCurrency(value) {
  return currencyFormatter.format(value)
}

/** Fecha local en formato YYYY-MM-DD */
export function toISODate(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Convierte 'YYYY-MM-DD' a Date local (sin desfase horario) */
export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const longDate = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const shortDate = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
const monthLabel = new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' })

export function formatLongDate(iso) {
  const today = toISODate()
  const yesterday = toISODate(new Date(Date.now() - 86_400_000))
  if (iso === today) return 'Hoy'
  if (iso === yesterday) return 'Ayer'
  const text = longDate.format(parseISODate(iso))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatShortDate(iso) {
  return shortDate.format(parseISODate(iso))
}

/** 'YYYY-MM' -> 'ene 26' */
export function formatMonthKey(key) {
  const [y, m] = key.split('-').map(Number)
  return monthLabel.format(new Date(y, m - 1, 1))
}

export function currentMonthName() {
  return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date())
}

/** Rangos de fechas predefinidos para los filtros */
export function getPresetRange(preset) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (preset) {
    case 'thisMonth':
      return { from: toISODate(new Date(y, m, 1)), to: toISODate(new Date(y, m + 1, 0)) }
    case 'lastMonth':
      return { from: toISODate(new Date(y, m - 1, 1)), to: toISODate(new Date(y, m, 0)) }
    case 'last3Months':
      return { from: toISODate(new Date(y, m - 2, 1)), to: toISODate(new Date(y, m + 1, 0)) }
    case 'thisYear':
      return { from: toISODate(new Date(y, 0, 1)), to: toISODate(new Date(y, 11, 31)) }
    default:
      return { from: '', to: '' }
  }
}
