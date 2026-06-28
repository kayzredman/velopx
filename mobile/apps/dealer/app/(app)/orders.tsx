import {useCallback, useEffect, useState, useMemo} from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useApi, useTheme, useThemedStyles, type ThemeColors} from '@velopx/shared'

interface OrderItem {
  id: string
  quantity: number
  price: string
  part: { id: string; name: string }
}

interface Order {
  id: string
  status: string
  totalAmount: string
  currency: string
  claimReference: string | null
  createdAt: string
  items: OrderItem[]
  delivery: { id: string; status: string; driverId: string | null } | null
  buyer?: { id: string; name: string | null; email: string }
}

type ViewMode = 'buyer' | 'seller'

const IN_PROGRESS_STATUSES = ['assigned', 'collected', 'in_transit']

function orderStatusColors(colors: ThemeColors): Record<string, string> {
  return {
    pending:    colors.warning,
    confirmed:  colors.info,
    dispatched: '#8B5CF6',
    delivered:  colors.success,
    completed:  colors.success,
    cancelled:  colors.error,
    disputed:   colors.error,
  }
}

export default function OrdersScreen() {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const STATUS_COLOR = useMemo(() => orderStatusColors(colors), [colors])
  const { apiFetch } = useApi()
  const router = useRouter()
  const [view, setView] = useState<ViewMode>('seller')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQueryState] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [creatingDeliveryId, setCreatingDeliveryId] = useState<string | null>(null)
  const [assignModal, setAssignModal] = useState<{ deliveryId: string } | null>(null)
  const [drivers, setDrivers] = useState<{ id: string; name: string | null; email: string }[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const fetchOrders = useCallback(
    async (mode: ViewMode, q: string, pageNum: number, append: boolean) => {
      try {
        if (mode === 'seller') {
          const res = await apiFetch<{ data: Order[] }>('/v1/orders/for-dealer')
          const filtered = q.trim()
            ? res.data.filter((o) =>
                o.claimReference?.toLowerCase().includes(q.trim().toLowerCase()),
              )
            : res.data
          setOrders(filtered)
          setTotal(filtered.length)
          setHasMore(false)
          setPage(1)
          return
        }

        const params = new URLSearchParams({
          view: 'buyer',
          page: String(pageNum),
          limit: '20',
        })
        if (q.trim()) params.set('q', q.trim())
        const res = await apiFetch<{
          data: Order[]
          meta: { total: number; page: number; pages: number }
        }>(`/v1/orders?${params}`)
        setTotal(res.meta.total)
        setHasMore(res.meta.page < res.meta.pages)
        setPage(res.meta.page)
        setOrders((prev) => (append ? [...prev, ...res.data] : res.data))
      } catch {
        // keep existing list on error
      }
    },
    [apiFetch],
  )

  useEffect(() => {
    setLoading(true)
    setQueryState('')
    fetchOrders(view, '', 1, false).finally(() => setLoading(false))
  }, [fetchOrders, view])

  async function onRefresh() {
    setRefreshing(true)
    await fetchOrders(view, query, 1, false)
    setRefreshing(false)
  }

  async function onLoadMore() {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    await fetchOrders(view, query, page + 1, true)
    setLoadingMore(false)
  }

  function setQuery(q: string) {
    setQueryState(q)
    setLoading(true)
    fetchOrders(view, q, 1, false).finally(() => setLoading(false))
  }

  async function handleConfirm(id: string) {
    setUpdatingId(id)
    try {
      await apiFetch(`/v1/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'confirmed' }),
      })
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: 'confirmed' } : o)),
      )
    } finally {
      setUpdatingId(null)
    }
  }

  async function createDelivery(orderId: string) {
    setCreatingDeliveryId(orderId)
    try {
      await apiFetch('/v1/deliveries', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      })
      await fetchOrders(view, query, 1, false)
    } finally {
      setCreatingDeliveryId(null)
    }
  }

  async function openAssignModal(deliveryId: string) {
    setAssignModal({ deliveryId })
    setSelectedDriverId('')
    setLoadingDrivers(true)
    try {
      const res = await apiFetch<{ data: { id: string; name: string | null; email: string }[] }>('/v1/deliveries/drivers')
      setDrivers(res.data)
    } finally {
      setLoadingDrivers(false)
    }
  }

  async function assignDriver() {
    if (!assignModal || !selectedDriverId) return
    setAssigning(true)
    try {
      await apiFetch(`/v1/deliveries/${assignModal.deliveryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'assigned', driverId: selectedDriverId }),
      })
      setAssignModal(null)
      await fetchOrders(view, query, 1, false)
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.orange500} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.count}>{total} order{total !== 1 ? 's' : ''}</Text>
      </View>

      {/* Buyer / Seller toggle */}
      <View style={styles.segmentRow}>
        {(['buyer', 'seller'] as ViewMode[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.segmentBtn, view === v && styles.segmentActive]}
            onPress={() => setView(v)}
          >
            <Text style={[styles.segmentText, view === v && styles.segmentTextActive]}>
              {v === 'buyer' ? 'My Orders' : 'Incoming'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by claim reference…"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.orange500} style={{ flex: 1 }} />
      ) : (
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange500} />}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {view === 'seller' ? 'No incoming orders for your parts yet.' : 'No orders yet.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.orange500} style={{ paddingVertical: 16 }} />
          ) : hasMore ? (
            <TouchableOpacity onPress={onLoadMore} style={styles.loadMoreBtn}>
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.amount}>
                  {item.currency} {Number(item.totalAmount).toLocaleString()}
                </Text>
                {item.claimReference ? (
                  <Text style={styles.claimRef}>{item.claimReference}</Text>
                ) : null}
                {view === 'seller' && item.buyer ? (
                  <Text style={styles.claimRef}>
                    From: {item.buyer.name ?? item.buyer.email}
                  </Text>
                ) : null}
                <Text style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={[styles.statusBadge, { borderColor: STATUS_COLOR[item.status] ?? colors.navy700 }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] ?? colors.textSecondary }]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <Text style={styles.itemList}>
              {item.items.map((i) => `${i.part.name} ×${i.quantity}`).join('  ·  ')}
            </Text>

            {item.delivery && (
              <View style={styles.deliveryRow}>
                <Text style={styles.deliveryLabel}>Delivery:</Text>
                <Text style={styles.deliveryStatus}>{item.delivery.status.replace('_', ' ')}</Text>
                {IN_PROGRESS_STATUSES.includes(item.delivery.status) && (() => {
                  const deliveryId = item.delivery?.id
                  return deliveryId ? (
                    <TouchableOpacity
                      style={styles.trackBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/delivery/[id]',
                          params: { id: deliveryId },
                        })
                      }
                    >
                      <Text style={styles.trackText}>Track →</Text>
                    </TouchableOpacity>
                  ) : null
                })()}
              </View>
            )}

            {item.status === 'pending' && (
              <TouchableOpacity
                style={[styles.confirmBtn, updatingId === item.id && styles.btnDisabled]}
                onPress={() => handleConfirm(item.id)}
                disabled={updatingId === item.id}
              >
                <Text style={styles.confirmText}>
                  {updatingId === item.id ? 'Confirming…' : 'Confirm Order'}
                </Text>
              </TouchableOpacity>
            )}

            {view === 'seller' && item.status === 'confirmed' && !item.delivery && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.primaryBtn, creatingDeliveryId === item.id && styles.btnDisabled]}
                onPress={() => createDelivery(item.id)}
                disabled={creatingDeliveryId === item.id}
              >
                <Text style={styles.primaryBtnText}>
                  {creatingDeliveryId === item.id ? 'Creating…' : 'Create Delivery'}
                </Text>
              </TouchableOpacity>
            )}

            {view === 'seller' && item.delivery?.status === 'pending' && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.secondaryBtn]}
                onPress={() => openAssignModal(item.delivery!.id)}
              >
                <Text style={styles.secondaryBtnText}>Assign Driver →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      )}

      {/* Assign Driver Modal */}
      <Modal
        visible={!!assignModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAssignModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Assign Driver</Text>
            {loadingDrivers ? (
              <ActivityIndicator color={colors.orange500} />
            ) : drivers.length === 0 ? (
              <Text style={styles.emptyText}>No drivers available</Text>
            ) : (
              drivers.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.driverRow, selectedDriverId === d.id && styles.driverRowSelected]}
                  onPress={() => setSelectedDriverId(d.id)}
                >
                  <Text style={[styles.driverName, selectedDriverId === d.id && { color: colors.orange500 }]}>
                    {d.name ?? d.email}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAssignModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, (!selectedDriverId || assigning) && styles.btnDisabled]}
                onPress={assignDriver}
                disabled={!selectedDriverId || assigning}
              >
                <Text style={styles.confirmText}>{assigning ? 'Assigning…' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.navy950 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: c.textPrimary },
  count: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: c.navy900,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: c.navy700,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: c.orange500,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
  },
  segmentTextActive: {
    color: c.navy950,
  },
  searchRow: { paddingHorizontal: 20, paddingBottom: 12 },
  searchInput: {
    backgroundColor: c.navy900,
    borderWidth: 1,
    borderColor: c.navy700,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: c.textPrimary,
  },
  list: { padding: 20, gap: 12 },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, color: c.orange500, fontWeight: '600' },
  card: {
    backgroundColor: c.navy900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.navy700,
    padding: 16,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  amount: { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  claimRef: { fontSize: 11, color: c.textSecondary, marginTop: 2 },
  date: { fontSize: 12, color: c.textSecondary, marginTop: 3 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  itemList: { fontSize: 12, color: c.textSecondary },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  deliveryLabel: { fontSize: 12, color: c.textSecondary },
  deliveryStatus: { fontSize: 12, color: c.textPrimary, textTransform: 'capitalize' },
  trackBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.orange500,
  },
  trackText: { fontSize: 11, fontWeight: '600', color: c.orange500 },
  confirmBtn: {
    backgroundColor: c.orange500,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  confirmText: { color: c.navy950, fontWeight: '700', fontSize: 13 },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: c.textSecondary, fontSize: 14 },
  // Create Delivery / Assign Driver
  actionBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center' as const, marginTop: 4 },
  primaryBtn: { backgroundColor: c.orange500 },
  primaryBtnText: { color: c.navy950, fontWeight: '700' as const, fontSize: 13 },
  secondaryBtn: { backgroundColor: c.navy800, borderWidth: 1, borderColor: c.orange500 },
  secondaryBtnText: { color: c.orange500, fontWeight: '600' as const, fontSize: 13 },
  // Driver modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' as const },
  modalBox: { backgroundColor: c.navy900, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 10 },
  modalTitle: { fontSize: 17, fontWeight: '700' as const, color: c.textPrimary, marginBottom: 4 },
  driverRow: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: c.navy700, backgroundColor: c.navy950 },
  driverRowSelected: { borderColor: c.orange500 },
  driverName: { fontSize: 14, color: c.textPrimary, fontWeight: '500' as const },
  modalActions: { flexDirection: 'row' as const, gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.navy700, alignItems: 'center' as const },
  cancelText: { color: c.textSecondary, fontWeight: '600' as const, fontSize: 14 },
})
}
