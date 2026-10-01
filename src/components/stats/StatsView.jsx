import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useFinance } from '../../context/finance'
import { TYPE_COLORS, themedColor } from '../../data/defaultCategories'
import { formatCurrency, formatMonthKey } from '../../utils/format'
import { computeTotals, monthlySeries, totalsByCategory } from '../../utils/stats'
import EmptyState from '../ui/EmptyState'

const CHROME = {
  light: { grid: '#e2e8f0', axis: '#64748b', surface: '#ffffff', other: '#94a3b8' },
  dark: { grid: '#1e293b', axis: '#94a3b8', surface: '#0f172a', other: '#64748b' },
}

const compactEuro = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

function ChartTooltip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      {label != null && (
        <p className="mb-1 font-semibold">{labelFormatter ? labelFormatter(label) : label}</p>
      )}
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: p.payload?.fill || p.color || p.fill }} />
          {p.name}:{' '}
          <span className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {formatCurrency(p.value)}
          </span>
        </p>
      ))}
    </div>
  )
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`card p-4 sm:p-5 ${className}`}>
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

/** Donut + tabla de categorías (la tabla da etiquetas y valores visibles) */
function CategoryBreakdown({ data, theme, emptyText }) {
  const chrome = CHROME[theme]
  if (!data.length) {
    return <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
  }

  // Más de 6 categorías: las pequeñas se agrupan en "Resto" en el donut
  const MAX = 6
  const pieData =
    data.length > MAX
      ? [
          ...data.slice(0, MAX - 1),
          {
            categoryId: '__rest',
            name: 'Resto',
            color: chrome.other,
            value: data.slice(MAX - 1).reduce((s, d) => s + d.value, 0),
          },
        ]
      : data
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
      <div className="relative mx-auto size-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={86}
              paddingAngle={data.length > 1 ? 1.5 : 0}
              stroke={chrome.surface}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {pieData.map((d) => (
                <Cell
                  key={d.categoryId}
                  fill={d.categoryId === '__rest' ? d.color : themedColor(d.color, theme)}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Total</span>
          <span className="text-sm font-bold tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>

      <ul className="space-y-2.5">
        {data.map((d) => (
          <li key={d.categoryId}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true">{d.icon}</span>
                <span className="truncate">{d.name}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                <span className="font-semibold">{formatCurrency(d.value)}</span>
                <span className="ml-2 inline-block w-11 text-right text-xs text-slate-500 dark:text-slate-400">
                  {(d.percent * 100).toFixed(1)}%
                </span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full"
                style={{ width: `${d.percent * 100}%`, backgroundColor: themedColor(d.color, theme) }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function StatsView({ transactions, theme }) {
  const { categoriesById } = useFinance()
  const [breakdownType, setBreakdownType] = useState('expense')
  const chrome = CHROME[theme]
  const colors = TYPE_COLORS[theme]

  const { totals, byExpense, byIncome, monthly } = useMemo(
    () => ({
      totals: computeTotals(transactions),
      byExpense: totalsByCategory(transactions, 'expense', categoriesById),
      byIncome: totalsByCategory(transactions, 'income', categoriesById),
      monthly: monthlySeries(transactions),
    }),
    [transactions, categoriesById],
  )

  if (!transactions.length) {
    return (
      <div className="card">
        <EmptyState
          icon="📊"
          title="No hay datos para este periodo"
          description="Añade movimientos o cambia el rango de fechas para ver estadísticas."
        />
      </div>
    )
  }

  const months = monthly.length || 1
  const savingsRate = totals.income ? (totals.balance / totals.income) * 100 : null
  const axisProps = {
    stroke: chrome.axis,
    tick: { fill: chrome.axis, fontSize: 11 },
    tickLine: false,
    axisLine: false,
  }

  const kpis = [
    { label: 'Gasto medio mensual', value: formatCurrency(totals.expense / months) },
    { label: 'Ingreso medio mensual', value: formatCurrency(totals.income / months) },
    {
      label: 'Tasa de ahorro',
      value: savingsRate == null ? '—' : `${savingsRate.toFixed(1)}%`,
    },
    {
      label: 'Mayor gasto',
      value: byExpense[0] ? `${byExpense[0].icon} ${byExpense[0].name}` : '—',
    },
  ]

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{k.label}</p>
            <p className="mt-1 truncate text-lg font-semibold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Ingresos vs gastos por mes */}
        <ChartCard title="Ingresos vs gastos" subtitle="Por mes">
          <Legend
            items={[
              { label: 'Ingresos', color: colors.income },
              { label: 'Gastos', color: colors.expense },
            ]}
          />
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} barGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={chrome.grid} />
                <XAxis dataKey="month" tickFormatter={formatMonthKey} {...axisProps} />
                <YAxis tickFormatter={(v) => compactEuro.format(v)} width={56} {...axisProps} />
                <Tooltip
                  cursor={{ fill: chrome.grid, opacity: 0.5 }}
                  content={<ChartTooltip labelFormatter={formatMonthKey} />}
                />
                <Bar dataKey="income" name="Ingresos" fill={colors.income} radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expense" name="Gastos" fill={colors.expense} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Evolución del saldo */}
        <ChartCard title="Evolución del saldo" subtitle="Saldo acumulado en el periodo">
          <div className="h-[17.5rem]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.income} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={colors.income} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={chrome.grid} />
                <XAxis dataKey="month" tickFormatter={formatMonthKey} {...axisProps} />
                <YAxis tickFormatter={(v) => compactEuro.format(v)} width={56} {...axisProps} />
                <ReferenceLine y={0} stroke={chrome.axis} strokeOpacity={0.5} />
                <Tooltip
                  cursor={{ stroke: chrome.axis, strokeDasharray: '3 3' }}
                  content={<ChartTooltip labelFormatter={formatMonthKey} />}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Saldo"
                  stroke={colors.income}
                  strokeWidth={2}
                  fill="url(#balanceFill)"
                  dot={monthly.length <= 12 ? { r: 4, strokeWidth: 2, fill: chrome.surface } : false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: chrome.surface }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Desglose por categoría */}
      <ChartCard title="Por categoría">
        <div role="tablist" className="mb-4 inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {[
            ['expense', 'Gastos'],
            ['income', 'Ingresos'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={breakdownType === value}
              onClick={() => setBreakdownType(value)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                breakdownType === value
                  ? 'bg-white shadow dark:bg-slate-700'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <CategoryBreakdown
          data={breakdownType === 'expense' ? byExpense : byIncome}
          theme={theme}
          emptyText={breakdownType === 'expense' ? 'No hay gastos en este periodo' : 'No hay ingresos en este periodo'}
        />
      </ChartCard>
    </div>
  )
}
