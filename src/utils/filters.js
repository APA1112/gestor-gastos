export const EMPTY_FILTERS = {
  type: 'all',
  categoryIds: [],
  from: '',
  to: '',
  preset: 'all',
  search: '',
}

export function countActiveFilters(filters) {
  return (
    (filters.type !== 'all') +
    (filters.categoryIds.length > 0) +
    Boolean(filters.from || filters.to) +
    Boolean(filters.search.trim())
  )
}
