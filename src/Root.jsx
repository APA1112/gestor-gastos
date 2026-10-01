import App from './App'
import AuthScreen from './components/auth/AuthScreen'
import NewPasswordScreen from './components/auth/NewPasswordScreen'
import SetupScreen from './components/auth/SetupScreen'
import { AuthProvider } from './context/AuthContext'
import { FinanceProvider } from './context/FinanceContext'
import { useAuth } from './context/auth'
import { isSupabaseConfigured } from './lib/supabase'

// Los datos ya no se guardan en el navegador: limpiar los de la versión anterior
try {
  localStorage.removeItem('finanzas:v1')
} catch {
  // ignorar
}

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Cargando">
      <span className="size-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
    </div>
  )
}

function Gate() {
  const { user, loading, recovering } = useAuth()
  if (loading) return <Splash />
  if (recovering) return <NewPasswordScreen />
  if (!user) return <AuthScreen />
  // key: al cambiar de usuario, el estado de datos empieza de cero
  return (
    <FinanceProvider key={user.id} userId={user.id}>
      <App />
    </FinanceProvider>
  )
}

export default function Root() {
  if (!isSupabaseConfigured) return <SetupScreen />
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
