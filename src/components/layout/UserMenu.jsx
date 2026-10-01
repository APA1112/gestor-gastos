import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/auth'
import { LogOutIcon } from '../ui/Icons'

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const email = user?.email ?? ''

  useEffect(() => {
    if (!open) return
    const onPointer = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menú de usuario"
        className="flex size-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 uppercase hover:ring-2 hover:ring-indigo-500/40 dark:bg-slate-700 dark:text-slate-100"
      >
        {email.charAt(0) || '?'}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">Sesión iniciada como</p>
            <p className="truncate text-sm font-medium">{email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <LogOutIcon className="size-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
