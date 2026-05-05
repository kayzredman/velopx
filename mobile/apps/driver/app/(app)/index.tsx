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
import { useRouter } from 'expo-router'

interface OrderItem {
  id: string
  quantity: number
  part: { id: string; name: string }
}

interface Delivery {
  id: string
  status: string
  proofUrl: string | null
  note: string | null
  createdAt: string
  order: {
    id: string
    claimReference: string | null
    totalAmount: string
    currency: string
    items: OrderItem[]
  }
}

const STATUS_COLOR: Record<string, string> = {
  pending:    Colors.textMuted,
  assigned:   Colors.info,
  collected:  Colors.warning,
  in_transit: '#8B5CF6',
  delivered:  Colors.success,
  confirmed:  Colors.success,
  disputed:   Colors.error,
}



export default function DriverDeliveriesScreen() {
  const { apiFetch } = useApi()
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Delivery[] }>('/v1/deliveries')
      setDeliveries(res.data)
    } catch {
      // keep existing
    }
  }, [apiFetch])

  useEffect(() => {
    fetchDeliveries().finally(() => setLoading(false))
  }, [fetchDeliveries])

  async function onRefresh() {
    setRefreshing(true)
    await fetchDeliveries()
    setRefreshing(false)
  }

  async function advanceStatus(delivery: Delivery) {
    const NEXT: Record<string, string> = {
      assigned:   'collected',
      collected:  'in_transit',
      in_transit: 'delivered',
    }
    const next = NEXT[delivery.status]
    if (!next) return

    setUpdatingId(delivery.id)
    try {
      await apiFetch(`/v1/deliveries/${delivery.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      })
      setDeliveries((prev) =>
        prev.map((d) => (d.id === delivery.id ? { ...d, status: next } : d)),
      )
    } finally {
      setUpdatingId(null)
    }
  }

  function getNextActionLabel(status: string): string | null {
    if (status === 'assigned') return 'Mark Collected'
    if (status === 'collected') return 'Mark In Transit'
    if (status === 'in_transit') return 'Mark Delivered'
    return null
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
        <Text style={styles.title}>My Deliveries</Text>
        <Text style={styles.count}>
          {deliveries.length} deliver{deliveries.length !== 1 ? 'ies' : 'y'}
        </Text>
      </View>

      <FlatList
        data={deliveries}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange500} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No deliveries assigned yet.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const actionLabel = getNextActionLabel(item.status)
          const isInTransit = item.status === 'in_transit'

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  {item.order.claimReference ? (
                    <Text style={styles.claimRef}>{item.order.claimReference}</Text>
                  ) : (
                    <Text style={styles.claimRef}>Order #{item.order.id.slice(0, 8)}</Text>
                  )}
                  <Text style={styles.amount}>
                    {item.order.currency} {Number(item.order.totalAmount).toLocaleString()}
                  </Text>
                  <Text style={styles.date}>
                    {new Date(item.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { borderColor: STATUS_COLOR[item.status] ?? Colors.navy700 }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] ?? Colors.textSecondary }]}>
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <Text style={styles.itemList}>
                {item.order.items.map((i) => `${i.part.name} ×${i.quantity}`).join('  ·  ')}
              </Text>

              {isInTransit ? (
                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() => router.push(`/delivery/${item.id}` as never)}
                >
                  <Text style={styles.detailBtnText}>Mark Delivered + Add Proof →</Text>
                </TouchableOpacity>
              ) : actionLabel ? (
                <TouchableOpacity
                  style={[styles.actionBtn, updatingId === item.id && styles.btnDisabled]}
                  onPress={() => advanceStatus(item)}
                  disabled={updatingId === item.id}
                >
                  <Text style={styles.actionBtnText}>
                    {updatingId === item.id ? 'Updating…' : actionLabel}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        }}
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
  claimRef: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  amount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  date: { fontSize: 11, color: Colors.textSecondary, marginTop: 3 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  itemList: { fontSize: 12, color: Colors.textSecondary },
  actionBtn: {
    backgroundColor: Colors.orange500,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  actionBtnText: { color: Colors.navy950, fontWeight: '700', fontSize: 13 },
  detailBtn: {
    backgroundColor: Colors.navy700,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  detailBtnText: { color: Colors.orange500, fontWeight: '600', fontSize: 13 },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
})
