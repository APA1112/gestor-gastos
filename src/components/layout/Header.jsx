import Button from '../ui/Button'
import { MoonIcon, PlusIcon, SunIcon } from '../ui/Icons'
import { TopNav } from './NavTabs'
import UserMenu from './UserMenu'

export default function Header({ tab, onTabChange, theme, onToggleTheme, onAdd }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white" aria-hidden="true">
            €
          </span>
          <h1 className="text-lg font-bold tracking-tight">Mis Finanzas</h1>
        </div>

        <div className="flex-1">
          <div className="flex justify-center">
            <TopNav current={tab} onChange={onTabChange} />
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="hidden md:block">
          <Button onClick={onAdd}>
            <PlusIcon className="size-4" />
            Nuevo
          </Button>
        </div>

        <UserMenu />
      </div>
    </header>
  )
}
