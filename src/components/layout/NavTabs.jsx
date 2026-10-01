import { TABS } from './tabs'

/** Navegación superior (escritorio) */
export function TopNav({ current, onChange }) {
  return (
    <nav aria-label="Secciones" className="hidden gap-1 md:flex">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-current={current === id ? 'page' : undefined}
          aria-label={label}
          title={label}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
            current === id
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Icon className="size-4" />
          <span className="hidden lg:inline">{label}</span>
        </button>
      ))}
    </nav>
  )
}

/** Barra de navegación inferior (móvil) */
export function BottomNav({ current, onChange }) {
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/90"
    >
      <div className="grid grid-cols-4">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={current === id ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
              current === id
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
