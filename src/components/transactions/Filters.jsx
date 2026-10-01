import { useState } from 'react'
import { useFinance } from '../../context/finance'
import { EMPTY_FILTERS, countActiveFilters } from '../../utils/filters'
import { getPresetRange } from '../../utils/format'
import { FilterIcon, SearchIcon, XIcon } from '../ui/Icons'

const PRESETS = [
  ['all', 'Todo'],
  ['thisMonth', 'Este mes'],
  ['lastMonth', 'Mes pasado'],
  ['last3Months', 'Últimos 3 meses'],
  ['thisYear', 'Este año'],
]

const TYPES = [
  ['all', 'Todos'],
  ['income', 'Ingresos'],
  ['expense', 'Gastos'],
]

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Panel de filtros. `compact` oculta tipo/categoría/búsqueda (para estadísticas).
 */
export default function Filters({ filters, onChange, compact = false }) {
  const { categories } = useFinance()
  const [open, setOpen] = useState(false)
  const set = (patch) => onChange({ ...filters, ...patch })
  const active = countActiveFilters(filters)

  const visibleCategories =
    filters.type === 'all' ? categories : categories.filter((c) => c.type === filters.type)

  const toggleCategory = (id) =>
    set({
      categoryIds: filters.categoryIds.includes(id)
        ? filters.categoryIds.filter((c) => c !== id)
        : [...filters.categoryIds, id],
    })

  const changeType = (type) =>
    set({
      type,
      // Descarta categorías que no encajan con el nuevo tipo
      categoryIds:
        type === 'all'
          ? filters.categoryIds
          : filters.categoryIds.filter((id) => categories.find((c) => c.id === id)?.type === type),
    })

  const dateRow = (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {PRESETS.map(([value, label]) => (
          <Chip
            key={value}
            active={filters.preset === value}
            onClick={() => set({ preset: value, ...getPresetRange(value) })}
          >
            {label}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-500 dark:text-slate-400">
          Desde
          <input
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => set({ from: e.target.value, preset: 'custom' })}
            className="input mt-1"
          />
        </label>
        <label className="text-xs text-slate-500 dark:text-slate-400">
          Hasta
          <input
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => set({ to: e.target.value, preset: 'custom' })}
            className="input mt-1"
          />
        </label>
      </div>
    </div>
  )

  if (compact) return <div className="card p-4">{dateRow}</div>

  return (
    <div className="card p-4">
      {/* Búsqueda + botón de filtros (móvil) */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Buscar movimientos…"
            aria-label="Buscar movimientos"
            className="input pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="relative inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 text-sm font-medium lg:hidden dark:border-slate-700"
        >
          <FilterIcon className="size-4" />
          Filtros
          {active > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
              {active}
            </span>
          )}
        </button>
      </div>

      <div className={`${open ? 'block' : 'hidden'} mt-4 space-y-5 lg:block`}>
        <div>
          <p className="label">Tipo</p>
          <div className="flex gap-2">
            {TYPES.map(([value, label]) => (
              <Chip key={value} active={filters.type === value} onClick={() => changeType(value)}>
                {label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="label">Fechas</p>
          {dateRow}
        </div>

        <div>
          <p className="label">Categorías</p>
          <div className="flex flex-wrap gap-2">
            {visibleCategories.map((c) => (
              <Chip
                key={c.id}
                active={filters.categoryIds.includes(c.id)}
                onClick={() => toggleCategory(c.id)}
              >
                <span aria-hidden="true">{c.icon}</span>
                {c.name}
              </Chip>
            ))}
          </div>
        </div>

        {active > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <XIcon className="size-4" />
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
