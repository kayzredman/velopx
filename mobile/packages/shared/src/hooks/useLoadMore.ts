import { useCallback, useRef, useState } from 'react'
import { useApi } from './useApi'

export interface PaginatedMeta {
  total: number
  page: number
  limit: number
  pages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginatedMeta
}

interface UseLoadMoreOptions<T> {
  /** Base path WITHOUT page/limit params, e.g. "/v1/parts?mine=true" */
  buildPath: (page: number, query: string) => string
  limit?: number
  /** Initial fetch happens automatically on mount */
  initialQuery?: string
}

interface UseLoadMoreResult<T> {
  items: T[]
  loading: boolean
  loadingMore: boolean
  refreshing: boolean
  hasMore: boolean
  total: number
  query: string
  setQuery: (q: string) => void
  /** Call from onRefresh of RefreshControl */
  onRefresh: () => Promise<void>
  /** Call from onEndReached of FlatList */
  onLoadMore: () => Promise<void>
  /** Manually replace an item in the list by id (item must have .id: string) */
  updateItem: (id: string, patch: Partial<T>) => void
  /** Remove an item by id */
  removeItem: (id: string) => void
}

export function useLoadMore<T extends { id: string }>(
  opts: UseLoadMoreOptions<T>,
): UseLoadMoreResult<T> {
  const { buildPath, limit = 20, initialQuery = '' } = opts
  const { apiFetch } = useApi()

  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [query, setQueryState] = useState(initialQuery)
  const pageRef = useRef(1)
  // Prevent double-calls on FlatList's onEndReached
  const loadingMoreRef = useRef(false)

  const fetchPage = useCallback(
    async (page: number, q: string, append: boolean) => {
      const path = buildPath(page, q)
      const res = await apiFetch<PaginatedResponse<T>>(path)
      const { data, meta } = res
      setTotal(meta.total)
      setHasMore(meta.page < meta.pages)
      pageRef.current = meta.page
      if (append) {
        setItems((prev) => [...prev, ...data])
      } else {
        setItems(data)
      }
    },
    [apiFetch, buildPath],
  )

  // Initial load
  const initialized = useRef(false)
  if (!initialized.current) {
    initialized.current = true
    fetchPage(1, initialQuery, false).finally(() => setLoading(false))
  }

  async function onRefresh() {
    setRefreshing(true)
    try {
      await fetchPage(1, query, false)
    } finally {
      setRefreshing(false)
    }
  }

  async function onLoadMore() {
    if (!hasMore || loadingMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      await fetchPage(pageRef.current + 1, query, true)
    } finally {
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }

  function setQuery(q: string) {
    setQueryState(q)
    setLoading(true)
    fetchPage(1, q, false).finally(() => setLoading(false))
  }

  function updateItem(id: string, patch: Partial<T>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return {
    items,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    total,
    query,
    setQuery,
    onRefresh,
    onLoadMore,
    updateItem,
    removeItem,
  }
}
