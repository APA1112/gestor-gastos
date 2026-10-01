import { useEffect, useRef } from 'react'
import { XIcon } from './Icons'

/**
 * Modal basado en <dialog> nativo (gestiona foco y tecla Esc).
 * En móvil se muestra como hoja inferior; en escritorio, centrado.
 */
export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg' }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      aria-labelledby="modal-title"
      className={`m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm sm:m-auto sm:rounded-2xl dark:bg-slate-900 dark:text-slate-100 ${widths[size]}`}
    >
      {open && (
        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Cerrar"
            >
              <XIcon />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
