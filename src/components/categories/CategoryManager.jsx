import { useState } from 'react'
import { useFinance } from '../../context/finance'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../data/defaultCategories'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { PencilIcon, PlusIcon, TrashIcon } from '../ui/Icons'
import Modal from '../ui/Modal'

function CategoryForm({ category, defaultType, onDone }) {
  const { categories, addCategory, updateCategory } = useFinance()
  const isEdit = Boolean(category)
  const [name, setName] = useState(category?.name ?? '')
  const [type, setType] = useState(category?.type ?? defaultType)
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0])
  const [icon, setIcon] = useState(category?.icon ?? CATEGORY_ICONS[0])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Escribe un nombre')
    const duplicate = categories.some(
      (c) => c.id !== category?.id && c.type === type && c.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (duplicate) return setError('Ya existe una categoría con ese nombre')
    const data = { name: trimmed, type, color, icon }
    setSaving(true)
    try {
      if (isEdit) await updateCategory({ ...data, id: category.id })
      else await addCategory(data)
      onDone()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {!isEdit && (
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {[
            ['expense', 'Gasto'],
            ['income', 'Ingreso'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={type === value}
              onClick={() => setType(value)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                type === value ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div>
        <label htmlFor="cat-name" className="label">
          Nombre
        </label>
        <div className="flex items-center gap-2">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl"
            style={{ backgroundColor: `${color}26` }}
            aria-hidden="true"
          >
            {icon}
          </span>
          <input
            id="cat-name"
            value={name}
            maxLength={30}
            autoFocus
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            placeholder="Ej. Mascotas"
            className="input"
          />
        </div>
        {error && <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </div>

      <fieldset>
        <legend className="label">Color</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className={`size-8 rounded-full transition ${
                color === c ? 'ring-2 ring-slate-900 ring-offset-2 dark:ring-white dark:ring-offset-slate-900' : ''
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Icono</legend>
        <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
          {CATEGORY_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              aria-pressed={icon === i}
              className={`flex aspect-square items-center justify-center rounded-lg text-lg transition ${
                icon === i
                  ? 'bg-indigo-100 ring-2 ring-indigo-500 dark:bg-indigo-500/20'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  )
}

export default function CategoryManager() {
  const { categories, transactions, deleteCategory } = useFinance()
  const [editing, setEditing] = useState(null) // { category?, type }
  const [toDelete, setToDelete] = useState(null)

  const usage = {}
  for (const t of transactions) usage[t.categoryId] = (usage[t.categoryId] ?? 0) + 1

  const sections = [
    { type: 'expense', title: 'Categorías de gastos' },
    { type: 'income', title: 'Categorías de ingresos' },
  ]

  const deleteMessage = (cat) => {
    const n = usage[cat.id] ?? 0
    const fallbackKey = cat.type === 'income' ? 'other-income' : 'other-expense'
    const fallback = categories.find((c) => c.systemKey === fallbackKey)
    return n
      ? `"${cat.name}" tiene ${n} movimiento${n === 1 ? '' : 's'}. Se moverán a "${fallback?.name}".`
      : `¿Seguro que quieres eliminar "${cat.name}"?`
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {sections.map(({ type, title }) => (
        <section key={type} className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="font-semibold">{title}</h3>
            <Button variant="ghost" className="px-3 py-1.5" onClick={() => setEditing({ type })}>
              <PlusIcon className="size-4" />
              Nueva
            </Button>
          </header>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {categories
              .filter((c) => c.type === type)
              .map((c) => {
                const isProtected = Boolean(c.systemKey)
                return (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-lg"
                      style={{ backgroundColor: `${c.color}26` }}
                      aria-hidden="true"
                    >
                      {c.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate font-medium">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {usage[c.id] ?? 0} movimiento{usage[c.id] === 1 ? '' : 's'}
                        {isProtected && ' · predeterminada'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditing({ category: c, type })}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      aria-label={`Editar ${c.name}`}
                    >
                      <PencilIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(c)}
                      disabled={isProtected}
                      title={isProtected ? 'Esta categoría no se puede eliminar' : undefined}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                      aria-label={`Eliminar ${c.name}`}
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </li>
                )
              })}
          </ul>
        </section>
      ))}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.category ? 'Editar categoría' : 'Nueva categoría'}
      >
        {editing && (
          <CategoryForm
            key={editing.category?.id ?? editing.type}
            category={editing.category}
            defaultType={editing.type}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar categoría"
        message={toDelete ? deleteMessage(toDelete) : ''}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          await deleteCategory(toDelete.id)
          setToDelete(null)
        }}
      />
    </div>
  )
}
