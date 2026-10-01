import { useActionState } from 'react'
import { useAuth } from '../../context/auth'
import { describeError } from '../../lib/supabase'
import Button from '../ui/Button'
import AuthLayout, { FormMessage } from './AuthLayout'

/** Se muestra al abrir el enlace de recuperación recibido por email */
export default function NewPasswordScreen() {
  const { updatePassword } = useAuth()

  const [state, formAction, isPending] = useActionState(async (_prev, formData) => {
    const password = String(formData.get('password') ?? '')
    if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres' }
    if (password !== formData.get('confirm')) return { error: 'Las contraseñas no coinciden' }
    const { error } = await updatePassword(password)
    if (error) return { error: describeError(error) }
    return {}
  }, {})

  return (
    <AuthLayout title="Nueva contraseña" subtitle="Elige una contraseña nueva para tu cuenta">
      <form action={formAction} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="label">
            Contraseña nueva
          </label>
          <input id="password" name="password" type="password" autoComplete="new-password" className="input" />
        </div>
        <div>
          <label htmlFor="confirm" className="label">
            Repite la contraseña
          </label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="input" />
        </div>
        <FormMessage>{state.error}</FormMessage>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Guardando…' : 'Guardar contraseña'}
        </Button>
      </form>
    </AuthLayout>
  )
}
