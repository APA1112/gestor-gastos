import { useActionState, useState } from 'react'
import { useAuth } from '../../context/auth'
import { describeError } from '../../lib/supabase'
import Button from '../ui/Button'
import AuthLayout, { FormMessage } from './AuthLayout'

const MIN_PASSWORD = 8

const MODES = {
  signin: { title: 'Mis Finanzas', subtitle: 'Inicia sesión para ver tus cuentas', submit: 'Entrar' },
  signup: { title: 'Crea tu cuenta', subtitle: 'Tus datos se guardan en la nube', submit: 'Crear cuenta' },
  reset: { title: 'Recuperar contraseña', subtitle: 'Te enviaremos un enlace por email', submit: 'Enviar enlace' },
}

export default function AuthScreen() {
  const [mode, setMode] = useState('signin')
  // key: cada modo empieza con el formulario y los mensajes limpios
  return <AuthForm key={mode} mode={mode} switchTo={setMode} />
}

function AuthForm({ mode, switchTo }) {
  const { signIn, signUp, resetPassword } = useAuth()

  const [state, formAction, isPending] = useActionState(
    async (_prev, formData) => {
      const email = String(formData.get('email') ?? '').trim()
      const password = String(formData.get('password') ?? '')
      const values = { email }

      if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Introduce un email válido', values }

      if (mode === 'reset') {
        const { error } = await resetPassword(email)
        if (error) return { error: describeError(error), values }
        return { info: 'Si existe una cuenta con ese email, recibirás un enlace para cambiar la contraseña.', values }
      }

      if (password.length < MIN_PASSWORD) {
        return { error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`, values }
      }

      if (mode === 'signup') {
        if (password !== formData.get('confirm')) return { error: 'Las contraseñas no coinciden', values }
        const { data, error } = await signUp(email, password)
        if (error) return { error: describeError(error), values }
        // Con confirmación por email activada no hay sesión todavía
        if (!data.session) {
          return { info: `Te hemos enviado un email a ${email}. Confirma tu cuenta y después inicia sesión.`, values }
        }
        return { values }
      }

      const { error } = await signIn(email, password)
      if (error) return { error: describeError(error), values }
      return { values }
    },
    { values: { email: '' } },
  )

  const copy = MODES[mode]

  return (
    <AuthLayout title={copy.title} subtitle={copy.subtitle}>
      {mode !== 'reset' && (
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {[
            ['signin', 'Iniciar sesión'],
            ['signup', 'Registrarse'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => switchTo(value)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === value ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <form action={formAction} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.values.email}
            className="input"
          />
        </div>

        {mode !== 'reset' && (
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="password" className="label">
                Contraseña
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => switchTo('reset')}
                  className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  ¿La has olvidado?
                </button>
              )}
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={MIN_PASSWORD}
              required
              className="input"
            />
            {mode === 'signup' && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Mínimo {MIN_PASSWORD} caracteres
              </p>
            )}
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <label htmlFor="confirm" className="label">
              Repite la contraseña
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              className="input"
            />
          </div>
        )}

        <FormMessage>{state.error}</FormMessage>
        <FormMessage kind="info">{state.info}</FormMessage>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Un momento…' : copy.submit}
        </Button>

        {mode === 'reset' && (
          <button
            type="button"
            onClick={() => switchTo('signin')}
            className="block w-full text-center text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Volver a iniciar sesión
          </button>
        )}
      </form>
    </AuthLayout>
  )
}
