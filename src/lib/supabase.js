import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** false si faltan las variables de entorno (se muestra una pantalla de ayuda) */
export const isSupabaseConfigured = Boolean(url && key)

export const supabase = isSupabaseConfigured ? createClient(url, key) : null

/** Traduce los errores habituales de Supabase al español */
export function describeError(error) {
  if (!error) return ''
  const msg = error.message ?? String(error)
  const map = [
    [/invalid login credentials/i, 'Email o contraseña incorrectos'],
    [/user already registered/i, 'Ya existe una cuenta con ese email'],
    [/email not confirmed/i, 'Confirma tu email antes de iniciar sesión (revisa tu bandeja de entrada)'],
    [/password should be at least/i, 'La contraseña es demasiado corta'],
    [/unable to validate email|invalid format/i, 'El email no es válido'],
    [/rate limit|too many requests/i, 'Demasiados intentos. Espera un momento y vuelve a probar'],
    [/categories_user_type_name_key|duplicate key/i, 'Ya existe una categoría con ese nombre'],
    [/no se puede eliminar/i, msg],
    [/failed to fetch|network/i, 'No se pudo conectar con el servidor. Revisa tu conexión'],
    [/jwt|not authorized|permission denied/i, 'Tu sesión ha caducado. Vuelve a iniciar sesión'],
  ]
  for (const [re, text] of map) if (re.test(msg)) return text
  return msg
}
