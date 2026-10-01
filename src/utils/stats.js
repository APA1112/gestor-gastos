/** Suma ingresos, gastos y saldo de una lista de movimientos */
export function computeTotals(transactions) {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }
  return { income, expense, balance: income - expense }
}

/** Aplica los filtros de tipo, categoría, fechas y texto */
export function filterTransactions(transactions, filters, categoriesById) {
  const search = filters.search.trim().toLowerCase()
  // Ignora categorías seleccionadas que ya se hayan eliminado
  const categoryIds = filters.categoryIds.filter((id) => categoriesById[id])
  return transactions.filter((t) => {
    if (filters.type !== 'all' && t.type !== filters.type) return false
    if (categoryIds.length && !categoryIds.includes(t.categoryId)) return false
    if (filters.from && t.date < filters.from) return false
    if (filters.to && t.date > filters.to) return false
    if (search) {
      const catName = categoriesById[t.categoryId]?.name ?? ''
      const haystack = `${t.description} ${catName}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}

/** Ordena por fecha descendente y, a igualdad, por creación */
export function sortByDateDesc(transactions) {
  return [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
  )
}

/** Agrupa movimientos por fecha (lista ya ordenada) */
export function groupByDate(transactions) {
  const groups = []
  for (const t of transactions) {
    const last = groups.at(-1)
    if (last && last.date === t.date) last.items.push(t)
    else groups.push({ date: t.date, items: [t] })
  }
  return groups
}

/** Totales por categoría para un tipo, ordenados de mayor a menor */
export function totalsByCategory(transactions, type, categoriesById) {
  const map = new Map()
  for (const t of transactions) {
    if (t.type !== type) continue
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0)
  return [...map.entries()]
    .map(([categoryId, value]) => {
      const cat = categoriesById[categoryId]
      return {
        categoryId,
        name: cat?.name ?? 'Sin categoría',
        icon: cat?.icon ?? '❔',
        color: cat?.color ?? '#94a3b8',
        value,
        percent: total ? value / total : 0,
      }
    })
    .sort((a, b) => b.value - a.value)
}

/** Ingresos, gastos y saldo acumulado por mes (YYYY-MM), en orden cronológico */
export function monthlySeries(transactions) {
  const map = new Map()
  for (const t of transactions) {
    const key = t.date.slice(0, 7)
    const entry = map.get(key) ?? { month: key, income: 0, expense: 0 }
    entry[t.type] += t.amount
    map.set(key, entry)
  }
  const months = [...map.values()].sort((a, b) => a.month.localeCompare(b.month))

  // Rellenar meses vacíos para que el eje sea continuo
  const filled = []
  for (let i = 0; i < months.length; i++) {
    filled.push(months[i])
    const next = months[i + 1]
    if (!next) break
    let [y, m] = months[i].month.split('-').map(Number)
    for (;;) {
      m++
      if (m > 12) { m = 1; y++ }
      const key = `${y}-${String(m).padStart(2, '0')}`
      if (key >= next.month) break
      filled.push({ month: key, income: 0, expense: 0 })
    }
  }

  let running = 0
  return filled.map((e) => {
    running += e.income - e.expense
    return { ...e, net: e.income - e.expense, balance: running }
  })
}
