import { Suspense, lazy, useMemo, useState } from 'react'
import CategoryManager from './components/categories/CategoryManager'
import Header from './components/layout/Header'
import { BottomNav } from './components/layout/NavTabs'
import { TABS } from './components/layout/tabs'
import SummaryCards from './components/summary/SummaryCards'
import Filters from './components/transactions/Filters'
import TransactionForm from './components/transactions/TransactionForm'
import TransactionItem from './components/transactions/TransactionItem'
import TransactionList from './components/transactions/TransactionList'
import Button from './components/ui/Button'
import ConfirmDialog from './components/ui/ConfirmDialog'
import EmptyState from './components/ui/EmptyState'
import { PlusIcon, RefreshIcon } from './components/ui/Icons'
import Modal from './components/ui/Modal'
import { useFinance } from './context/finance'
import { themedColor } from './data/defaultCategories'
import { useTheme } from './hooks/useTheme'
import { EMPTY_FILTERS } from './utils/filters'
import { currentMonthName, formatCurrency, formatShortDate, getPresetRange } from './utils/format'
import { computeTotals, filterTransactions, sortByDateDesc, totalsByCategory } from './utils/stats'

function LoadingSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Cargando datos">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="col-span-2 h-32 animate-pulse rounded-2xl bg-slate-200 lg:col-span-1 dark:bg-slate-800" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>
  )
}

// Recharts solo se descarga al abrir Estadísticas
const StatsView = lazy(() => import('./components/stats/StatsView'))

export default function App() {
  const { status, loadError, reload, transactions, categoriesById, deleteTransaction } = useFinance()
  const { theme, toggleTheme } = useTheme()

  const [tab, setTab] = useState('summary')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [statsRange, setStatsRange] = useState({ ...EMPTY_FILTERS, preset: 'thisYear', ...getPresetRange('thisYear') })
  const [form, setForm] = useState(null) // null | { transaction? }
  const [toDelete, setToDelete] = useState(null)

  const sorted = useMemo(() => sortByDateDesc(transactions), [transactions])
  const globalTotals = useMemo(() => computeTotals(transactions), [transactions])

  const filtered = useMemo(
    () => filterTransactions(sorted, filters, categoriesById),
    [sorted, filters, categoriesById],
  )
  const filteredTotals = useMemo(() => computeTotals(filtered), [filtered])

  const statsTransactions = useMemo(
    () => filterTransactions(sorted, statsRange, categoriesById),
    [sorted, statsRange, categoriesById],
  )

  const thisMonth = useMemo(() => {
    const range = getPresetRange('thisMonth')
    const list = filterTransactions(sorted, { ...EMPTY_FILTERS, ...range }, categoriesById)
    return {
      totals: computeTotals(list),
      topExpenses: totalsByCategory(list, 'expense', categoriesById).slice(0, 4),
    }
  }, [sorted, categoriesById])

  const openNew = () => setForm({})
  const openEdit = (transaction) => setForm({ transaction })
  const changeTab = (id) => {
    setTab(id)
    window.scrollTo({ top: 0 })
  }

  const monthName = currentMonthName()
  const currentTab = TABS.find((t) => t.id === tab)

  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      <Header
        tab={tab}
        onTabChange={changeTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onAdd={openNew}
      />

      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">
        <h2 className="mb-4 text-2xl font-bold tracking-tight md:sr-only">{currentTab.label}</h2>

        {status === 'ready' && loadError && (
          <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <span>No se pudieron sincronizar los datos: {loadError}</span>
            <button type="button" onClick={reload} className="shrink-0 font-semibold hover:underline">
              Reintentar
            </button>
          </div>
        )}

        {status === 'loading' && <LoadingSkeleton />}

        {status === 'error' && (
          <div className="card">
            <EmptyState
              icon="⚠️"
              title="No se pudieron cargar tus datos"
              description={loadError}
              action={
                <Button onClick={reload}>
                  <RefreshIcon className="size-4" /> Reintentar
                </Button>
              }
            />
          </div>
        )}

        {status === 'ready' && (
          <>

        {/* ---------- RESUMEN ---------- */}
        {tab === 'summary' && (
          <div className="space-y-6">
            <SummaryCards
              totals={globalTotals}
              caption={`${transactions.length} movimiento${transactions.length === 1 ? '' : 's'} registrados`}
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              <section className="card p-5">
                <h3 className="font-semibold">
                  Este mes <span className="font-normal text-slate-500 capitalize dark:text-slate-400">· {monthName}</span>
                </h3>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Ingresos', thisMonth.totals.income, 'text-blue-600 dark:text-blue-400'],
                    ['Gastos', thisMonth.totals.expense, 'text-rose-600 dark:text-rose-400'],
                    ['Balance', thisMonth.totals.balance, ''],
                  ].map(([label, value, cls]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
                      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
                      <dd className={`mt-0.5 truncate text-sm font-semibold tabular-nums sm:text-base ${cls}`}>
                        {value < 0 && '−'}
                        {formatCurrency(Math.abs(value))}
                      </dd>
                    </div>
                  ))}
                </dl>

                <h4 className="mt-6 mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Principales gastos
                </h4>
                {thisMonth.topExpenses.length ? (
                  <ul className="space-y-3">
                    {thisMonth.topExpenses.map((c) => (
                      <li key={c.categoryId}>
                        <div className="flex justify-between gap-2 text-sm">
                          <span className="truncate">
                            <span aria-hidden="true">{c.icon}</span> {c.name}
                          </span>
                          <span className="font-semibold tabular-nums">{formatCurrency(c.value)}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${c.percent * 100}%`, backgroundColor: themedColor(c.color, theme) }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Sin gastos este mes.</p>
                )}
              </section>

              <section className="card overflow-hidden">
                <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <h3 className="font-semibold">Últimos movimientos</h3>
                  {transactions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => changeTab('transactions')}
                      className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Ver todos
                    </button>
                  )}
                </header>
                {sorted.length ? (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sorted.slice(0, 6).map((t) => (
                      <TransactionItem
                        key={t.id}
                        transaction={t}
                        showDate
                        dateLabel={formatShortDate(t.date)}
                        onEdit={openEdit}
                        onDelete={setToDelete}
                      />
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="Aún no hay movimientos"
                    description="Registra tu primer ingreso o gasto para empezar."
                    action={
                      <Button onClick={openNew}>
                        <PlusIcon className="size-4" /> Añadir movimiento
                      </Button>
                    }
                  />
                )}
              </section>
            </div>
          </div>
        )}

        {/* ---------- MOVIMIENTOS ---------- */}
        {tab === 'transactions' && (
          <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr] lg:gap-6">
            <div className="lg:sticky lg:top-24">
              <Filters filters={filters} onChange={setFilters} />
            </div>

            <div className="min-w-0 space-y-4">
              <div className="card grid grid-cols-3 divide-x divide-slate-100 text-center dark:divide-slate-800">
                {[
                  ['Ingresos', filteredTotals.income, 'text-blue-600 dark:text-blue-400'],
                  ['Gastos', filteredTotals.expense, 'text-rose-600 dark:text-rose-400'],
                  ['Balance', filteredTotals.balance, ''],
                ].map(([label, value, cls]) => (
                  <div key={label} className="px-2 py-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                    <p className={`truncate text-sm font-semibold tabular-nums sm:text-base ${cls}`}>
                      {value < 0 && '−'}
                      {formatCurrency(Math.abs(value))}
                    </p>
                  </div>
                ))}
              </div>
              <p className="px-1 text-xs text-slate-500 dark:text-slate-400">
                {filtered.length} de {transactions.length} movimientos
              </p>

              {filtered.length ? (
                <TransactionList transactions={filtered} onEdit={openEdit} onDelete={setToDelete} />
              ) : (
                <div className="card">
                  {transactions.length ? (
                    <EmptyState
                      icon="🔍"
                      title="Sin resultados"
                      description="Ningún movimiento coincide con los filtros."
                      action={
                        <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                          Limpiar filtros
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState
                      title="Aún no hay movimientos"
                      action={
                        <Button onClick={openNew}>
                          <PlusIcon className="size-4" /> Añadir movimiento
                        </Button>
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------- ESTADÍSTICAS ---------- */}
        {tab === 'stats' && (
          <div className="space-y-4">
            <Filters filters={statsRange} onChange={setStatsRange} compact />
            <Suspense fallback={<div className="card h-64 animate-pulse" />}>
              <StatsView transactions={statsTransactions} theme={theme} />
            </Suspense>
          </div>
        )}

        {/* ---------- CATEGORÍAS ---------- */}
        {tab === 'categories' && <CategoryManager />}
          </>
        )}
      </main>

      {/* Botón flotante (móvil) */}
      <button
        type="button"
        onClick={openNew}
        aria-label="Añadir movimiento"
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95 md:hidden"
      >
        <PlusIcon className="size-6" />
      </button>

      <BottomNav current={tab} onChange={changeTab} />

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?.transaction ? 'Editar movimiento' : 'Nuevo movimiento'}
      >
        {form && (
          <TransactionForm
            key={form.transaction?.id ?? 'new'}
            transaction={form.transaction}
            onDone={() => setForm(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar movimiento"
        message={
          toDelete
            ? `¿Eliminar "${toDelete.description || categoriesById[toDelete.categoryId]?.name || 'movimiento'}" de ${formatCurrency(toDelete.amount)}? Esta acción no se puede deshacer.`
            : ''
        }
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          await deleteTransaction(toDelete.id)
          setToDelete(null)
        }}
      />
    </div>
  )
}
