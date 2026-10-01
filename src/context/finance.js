import { createContext, use } from 'react'

export const FinanceContext = createContext(null)

export function useFinance() {
  const ctx = use(FinanceContext)
  if (!ctx) throw new Error('useFinance debe usarse dentro de <FinanceProvider>')
  return ctx
}

// ---------- Conversión entre filas de la BD y objetos de la app ----------

export const TRANSACTION_COLUMNS = 'id, type, amount, category_id, date, description, created_at'
export const CATEGORY_COLUMNS = 'id, name, type, color, icon, system_key'

export function fromTransactionRow(row) {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    categoryId: row.category_id,
    date: row.date,
    description: row.description ?? '',
    createdAt: Date.parse(row.created_at),
  }
}

export function toTransactionRow(t) {
  return {
    type: t.type,
    amount: t.amount,
    category_id: t.categoryId,
    date: t.date,
    description: t.description ?? '',
  }
}

export function fromCategoryRow(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    color: row.color,
    icon: row.icon,
    systemKey: row.system_key,
  }
}

// ---------- Estado local (copia de lo que hay en la BD) ----------

export const initialFinanceState = { status: 'loading', transactions: [], categories: [] }

export function financeReducer(state, action) {
  switch (action.type) {
    case 'LOADED':
      return {
        status: 'ready',
        transactions: action.transactions,
        categories: action.categories,
      }

    case 'LOAD_FAILED':
      return { ...state, status: state.status === 'ready' ? 'ready' : 'error' }

    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] }

    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t,
        ),
      }

    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) }

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] }

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === action.payload.id ? action.payload : c)),
      }

    case 'DELETE_CATEGORY': {
      // La BD ya ha reasignado los movimientos; aquí replicamos el cambio
      const cat = state.categories.find((c) => c.id === action.id)
      if (!cat) return state
      const fallbackKey = cat.type === 'income' ? 'other-income' : 'other-expense'
      const fallback = state.categories.find((c) => c.systemKey === fallbackKey)
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.id),
        transactions: state.transactions.map((t) =>
          t.categoryId === action.id && fallback ? { ...t, categoryId: fallback.id } : t,
        ),
      }
    }

    default:
      return state
  }
}
