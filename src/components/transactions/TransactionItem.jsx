import { useFinance } from '../../context/finance'
import { formatCurrency } from '../../utils/format'
import { PencilIcon, TrashIcon } from '../ui/Icons'

export default function TransactionItem({ transaction, onEdit, onDelete, showDate = false, dateLabel }) {
  const { categoriesById } = useFinance()
  const cat = categoriesById[transaction.categoryId]
  const isIncome = transaction.type === 'income'
  const title = transaction.description || cat?.name || 'Sin categoría'

  return (
    <li className="group flex items-center gap-3 px-4 py-3">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-lg"
        style={{ backgroundColor: `${cat?.color ?? '#94a3b8'}26` }}
        aria-hidden="true"
      >
        {cat?.icon ?? '❔'}
      </span>

      {/* En móvil, tocar el movimiento abre la edición */}
      <button
        type="button"
        onClick={onEdit ? () => onEdit(transaction) : undefined}
        disabled={!onEdit}
        tabIndex={-1}
        className="min-w-0 flex-1 text-left sm:pointer-events-none"
      >
        <p className="truncate font-medium">{title}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {cat?.name ?? 'Sin categoría'}
          {showDate && ` · ${dateLabel}`}
        </p>
      </button>

      <p
        className={`shrink-0 font-semibold tabular-nums ${
          isIncome ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
        }`}
      >
        <span className="sr-only">{isIncome ? 'Ingreso' : 'Gasto'} de </span>
        {isIncome ? '+' : '−'}
        {formatCurrency(transaction.amount)}
      </p>

      {(onEdit || onDelete) && (
        <div className="flex shrink-0 gap-0.5 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(transaction)}
              className="hidden rounded-lg p-2 sm:block text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label={`Editar ${title}`}
            >
              <PencilIcon className="size-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(transaction)}
              className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              aria-label={`Eliminar ${title}`}
            >
              <TrashIcon className="size-4" />
            </button>
          )}
        </div>
      )}
    </li>
  )
}
