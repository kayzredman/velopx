import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, useApi } from '@velopx/shared'

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
  delivery: { id: string; status: string } | null
}

const STATUS_COLOR: Record<string, string> = {
  pending:    Colors.warning,
  confirmed:  Colors.info,
  dispatched: '#8B5CF6',
  delivered:  Colors.success,
  completed:  Colors.success,
  cancelled:  Colors.error,
  disputed:   Colors.error,
}

const CONFIRMABLE_STATUSES = ['pending', 'confirmed', 'dispatched', 'delivered']

export default function OrdersScreen() {
  const { apiFetch } = useApi()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Order[] }>('/v1/orders/for-dealer')
      setOrders(res.data)
    } catch {
      // silently keep existing state on refresh failures
    }
  }, [apiFetch])

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false))
  }, [fetchOrders])

  async function onRefresh() {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.orange500} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.count}>{orders.length} order{orders.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange500} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No orders yet.</Text>
          </View>
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
                <Text style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={[styles.statusBadge, { borderColor: STATUS_COLOR[item.status] ?? Colors.navy700 }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] ?? Colors.textSecondary }]}>
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
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy950 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  count: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  list: { padding: 20, gap: 12 },
  card: {
    backgroundColor: Colors.navy900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.navy700,
    padding: 16,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  amount: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  claimRef: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  date: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  itemList: { fontSize: 12, color: Colors.textSecondary },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deliveryLabel: { fontSize: 12, color: Colors.textSecondary },
  deliveryStatus: { fontSize: 12, color: Colors.textPrimary, textTransform: 'capitalize' },
  confirmBtn: {
    backgroundColor: Colors.orange500,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  confirmText: { color: Colors.navy950, fontWeight: '700', fontSize: 13 },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
})
