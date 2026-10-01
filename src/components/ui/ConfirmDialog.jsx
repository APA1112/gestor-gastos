import { useState } from 'react'
import Button from './Button'
import Modal from './Modal'

/** `onConfirm` puede ser asíncrono; si lanza un error se muestra en el diálogo */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const close = () => {
    setError('')
    onCancel()
  }

  const confirm = async () => {
    setBusy(true)
    setError('')
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title={title} size="sm">
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={close} disabled={busy}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={confirm} disabled={busy}>
          {busy ? 'Eliminando…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
