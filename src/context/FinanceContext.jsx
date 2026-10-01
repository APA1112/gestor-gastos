import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { describeError, supabase } from '../lib/supabase'
import {
  CATEGORY_COLUMNS,
  FinanceContext,
  TRANSACTION_COLUMNS,
  financeReducer,
  fromCategoryRow,
  fromTransactionRow,
  initialFinanceState,
  toTransactionRow,
} from './finance'

/** Lanza un Error legible si Supabase devuelve error */
function unwrap({ data, error }) {
  if (error) throw new Error(describeError(error))
  return data
}

/**
 * Datos del usuario autenticado. Las mutaciones escriben en Supabase y,
 * si van bien, actualizan el estado local. Si fallan, lanzan un Error.
 */
export function FinanceProvider({ userId, children }) {
  const [state, dispatch] = useReducer(financeReducer, initialFinanceState)
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async () => {
    try {
      const [categories, transactions] = await Promise.all([
        supabase.from('categories').select(CATEGORY_COLUMNS).order('created_at').then(unwrap),
        supabase.from('transactions').select(TRANSACTION_COLUMNS).then(unwrap),
      ])
      dispatch({
        type: 'LOADED',
        categories: categories.map(fromCategoryRow),
        transactions: transactions.map(fromTransactionRow),
      })
      setLoadError('')
    } catch (err) {
      dispatch({ type: 'LOAD_FAILED' })
      setLoadError(err.message)
    }
  }, [])

  // Carga inicial y resincronización al volver a la pestaña
  // (para ver cambios hechos desde otros dispositivos)
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- petición a la API: el estado se actualiza tras el await
    load()
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', load)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', load)
    }
  }, [load, userId])

  const value = useMemo(() => {
    const categoriesById = Object.fromEntries(state.categories.map((c) => [c.id, c]))
    return {
      status: state.status,
      loadError,
      reload: load,
      transactions: state.transactions,
      categories: state.categories,
      categoriesById,

      addTransaction: async (data) => {
        const row = await supabase
          .from('transactions')
          .insert(toTransactionRow(data))
          .select(TRANSACTION_COLUMNS)
          .single()
          .then(unwrap)
        dispatch({ type: 'ADD_TRANSACTION', payload: fromTransactionRow(row) })
      },

      updateTransaction: async (data) => {
        const row = await supabase
          .from('transactions')
          .update(toTransactionRow(data))
          .eq('id', data.id)
          .select(TRANSACTION_COLUMNS)
          .single()
          .then(unwrap)
        dispatch({ type: 'UPDATE_TRANSACTION', payload: fromTransactionRow(row) })
      },

      deleteTransaction: async (id) => {
        await supabase.from('transactions').delete().eq('id', id).then(unwrap)
        dispatch({ type: 'DELETE_TRANSACTION', id })
      },

      addCategory: async ({ name, type, color, icon }) => {
        const row = await supabase
          .from('categories')
          .insert({ name, type, color, icon })
          .select(CATEGORY_COLUMNS)
          .single()
          .then(unwrap)
        dispatch({ type: 'ADD_CATEGORY', payload: fromCategoryRow(row) })
      },

      updateCategory: async ({ id, name, color, icon }) => {
        const row = await supabase
          .from('categories')
          .update({ name, color, icon })
          .eq('id', id)
          .select(CATEGORY_COLUMNS)
          .single()
          .then(unwrap)
        dispatch({ type: 'UPDATE_CATEGORY', payload: fromCategoryRow(row) })
      },

      deleteCategory: async (id) => {
        await supabase.from('categories').delete().eq('id', id).then(unwrap)
        dispatch({ type: 'DELETE_CATEGORY', id })
      },
    }
  }, [state, loadError, load])

  return <FinanceContext value={value}>{children}</FinanceContext>
}
