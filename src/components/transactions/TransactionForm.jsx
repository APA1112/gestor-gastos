import { useActionState, useState } from 'react'
import { useFinance } from '../../context/finance'
import { toISODate } from '../../utils/format'
import Button from '../ui/Button'

function parseAmount(raw) {
  const normalized = String(raw).trim().replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return NaN
  return Number(normalized)
}

/**
 * Formulario para crear o editar un movimiento.
 * `transaction` presente => modo edición.
 */
export default function TransactionForm({ transaction, onDone }) {
  const { categories, addTransaction, updateTransaction } = useFinance()
  const isEdit = Boolean(transaction)

  const [type, setType] = useState(transaction?.type ?? 'expense')
  const available = categories.filter((c) => c.type === type)
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId ?? available[0]?.id ?? '',
  )

  const changeType = (next) => {
    setType(next)
    setCategoryId(categories.find((c) => c.type === next)?.id ?? '')
  }

  // Los valores se devuelven en el estado para que, tras el reseteo automático
  // del formulario en React 19, los campos conserven lo escrito si hay errores.
  const [state, formAction, isPending] = useActionState(
    async (_prev, formData) => {
      const values = {
        amount: formData.get('amount'),
        date: formData.get('date'),
        description: formData.get('description'),
      }
      const errors = {}
      const amount = parseAmount(values.amount)
      if (!values.amount) errors.amount = 'Introduce un importe'
      else if (Number.isNaN(amount)) errors.amount = 'Importe no válido (máx. 2 decimales)'
      else if (amount <= 0) errors.amount = 'El importe debe ser mayor que 0'
      if (!values.date) errors.date = 'Elige una fecha'
      if (!categoryId) errors.category = 'Elige una categoría'

      if (Object.keys(errors).length) return { errors, values }

      const data = {
        type,
        amount,
        categoryId,
        date: values.date,
        description: values.description.trim(),
      }
      try {
        if (isEdit) await updateTransaction({ ...data, id: transaction.id })
        else await addTransaction(data)
      } catch (err) {
        return { errors: { form: err.message }, values }
      }
      onDone()
      return { errors: {}, values }
    },
    {
      errors: {},
      values: {
        amount: transaction ? String(transaction.amount).replace('.', ',') : '',
        date: transaction?.date ?? toISODate(),
        description: transaction?.description ?? '',
      },
    },
  )

  const { errors, values } = state

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {/* Tipo */}
      <div role="radiogroup" aria-label="Tipo de movimiento" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {[
          ['expense', 'Gasto', 'bg-rose-600'],
          ['income', 'Ingreso', 'bg-blue-600'],
        ].map(([value, label, active]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={type === value}
            onClick={() => changeType(value)}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              type === value
                ? `${active} text-white shadow`
                : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-700/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Importe */}
      <div>
        <label htmlFor="amount" className="label">
          Importe (€)
        </label>
        <input
          id="amount"
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          defaultValue={values.amount}
          autoFocus={!isEdit}
          aria-invalid={Boolean(errors.amount)}
          aria-describedby={errors.amount ? 'amount-error' : undefined}
          className="input text-2xl font-semibold tabular-nums sm:text-2xl"
        />
        {errors.amount && (
          <p id="amount-error" className="mt-1 text-sm text-rose-600 dark:text-rose-400">
            {errors.amount}
          </p>
        )}
      </div>

      {/* Categoría */}
      <fieldset>
        <legend className="label">Categoría</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {available.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              aria-pressed={categoryId === c.id}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition ${
                categoryId === c.id
                  ? 'border-indigo-500 bg-indigo-50 font-semibold ring-2 ring-indigo-500/30 dark:bg-indigo-500/10'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              <span
                className="flex size-8 items-center justify-center rounded-full text-base"
                style={{ backgroundColor: `${c.color}26` }}
                aria-hidden="true"
              >
                {c.icon}
              </span>
              <span className="line-clamp-1 w-full text-center">{c.name}</span>
            </button>
          ))}
        </div>
        {errors.category && (
          <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.category}</p>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Fecha */}
        <div>
          <label htmlFor="date" className="label">
            Fecha
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={values.date}
            aria-invalid={Boolean(errors.date)}
            className="input"
          />
          {errors.date && (
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.date}</p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="label">
            Descripción <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id="description"
            name="description"
            maxLength={80}
            placeholder="Ej. Compra semanal"
            defaultValue={values.description}
            className="input"
          />
        </div>
      </div>

      {errors.form && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {errors.form}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Añadir movimiento'}
        </Button>
      </div>
    </form>
  )
}
