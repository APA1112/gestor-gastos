import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './auth'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  // true tras abrir el enlace de "restablecer contraseña" del email
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'SIGNED_OUT') setRecovering(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      recovering,
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signUp: (email, password) =>
        supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        }),
      resetPassword: (email) =>
        supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }),
      updatePassword: async (password) => {
        const result = await supabase.auth.updateUser({ password })
        if (!result.error) setRecovering(false)
        return result
      },
      signOut: () => supabase.auth.signOut(),
    }),
    [session, loading, recovering],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
