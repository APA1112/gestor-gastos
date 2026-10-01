import { formatCurrency } from '../../utils/format'
import { ArrowDownIcon, ArrowUpIcon, WalletIcon } from '../ui/Icons'

/** Saldo destacado + ingresos y gastos */
export default function SummaryCards({ totals, balanceLabel = 'Saldo actual', caption }) {
  const { balance, income, expense } = totals

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <div className="col-span-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-600/20 lg:col-span-1">
        <div className="flex items-center gap-2 text-sm text-indigo-100">
          <WalletIcon className="size-4" />
          {balanceLabel}
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {balance < 0 && '−'}
          {formatCurrency(Math.abs(balance))}
        </p>
        {caption && <p className="mt-1 text-xs text-indigo-100">{caption}</p>}
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <ArrowUpIcon className="size-3.5" />
          </span>
          Ingresos
        </div>
        <p className="mt-2 truncate text-xl font-semibold sm:text-2xl">{formatCurrency(income)}</p>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="flex size-6 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
            <ArrowDownIcon className="size-3.5" />
          </span>
          Gastos
        </div>
        <p className="mt-2 truncate text-xl font-semibold sm:text-2xl">{formatCurrency(expense)}</p>
      </div>
    </div>
  )
}
