import { useMemo } from 'react'
import { formatCurrency, formatLongDate } from '../../utils/format'
import { groupByDate } from '../../utils/stats'
import TransactionItem from './TransactionItem'

/** Lista de movimientos agrupada por día. Recibe la lista ya ordenada. */
export default function TransactionList({ transactions, onEdit, onDelete }) {
  const groups = useMemo(() => groupByDate(transactions), [transactions])

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const net = group.items.reduce(
          (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
          0,
        )
        return (
          <section key={group.date} className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              <h3>{formatLongDate(group.date)}</h3>
              <span className="tabular-nums">
                {net >= 0 ? '+' : '−'}
                {formatCurrency(Math.abs(net))}
              </span>
            </header>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {group.items.map((t) => (
                <TransactionItem key={t.id} transaction={t} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
