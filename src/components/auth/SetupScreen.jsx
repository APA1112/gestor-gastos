import AuthLayout from './AuthLayout'

/** Aviso para el desarrollador cuando faltan las variables de entorno */
export default function SetupScreen() {
  return (
    <AuthLayout title="Falta configurar Supabase" subtitle="La app necesita conectarse a la base de datos">
      <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
        <li>
          Copia <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env.example</code> a{' '}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env.local</code>.
        </li>
        <li>
          Rellena <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">VITE_SUPABASE_URL</code> y{' '}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">VITE_SUPABASE_PUBLISHABLE_KEY</code>.
        </li>
        <li>Reinicia el servidor de desarrollo.</li>
      </ol>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Más detalles en el README del proyecto.</p>
    </AuthLayout>
  )
}
