// Las categorías iniciales de cada usuario las crea la base de datos al
// registrarse (ver supabase/migrations). Aquí solo viven los colores e iconos.

/**
 * Paleta categórica validada para daltonismo (orden fijo).
 * Clave: color en modo claro → valor: su equivalente para modo oscuro.
 */
export const PALETTE = {
  '#2a78d6': '#3987e5', // azul
  '#eb6834': '#d95926', // naranja
  '#1baf7a': '#199e70', // aguamarina
  '#eda100': '#c98500', // amarillo
  '#e87ba4': '#d55181', // magenta
  '#008300': '#008300', // verde
  '#4a3aa7': '#9085e9', // violeta
  '#e34948': '#e66767', // rojo
}
export const CATEGORY_COLORS = [...Object.keys(PALETTE), '#64748b']

/** Colores de ingresos/gastos en gráficos (par azul↔rojo, seguro para daltonismo) */
export const TYPE_COLORS = {
  light: { income: '#2a78d6', expense: '#e34948' },
  dark: { income: '#3987e5', expense: '#e66767' },
}

export function themedColor(hex, theme) {
  return theme === 'dark' ? (PALETTE[hex] ?? hex) : hex
}

export const CATEGORY_ICONS = [
  '🛒', '🏠', '🚗', '💡', '🎉', '💊', '🛍️', '📦', '💼', '🧑‍💻', '🎁', '💰',
  '🍽️', '☕', '✈️', '🎓', '🐶', '👶', '📱', '🎮', '🏋️', '📚', '🎬', '🏦',
  '🔧', '👕', '💳', '📈', '🏥', '⛽',
]
