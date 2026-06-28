import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApi, useTheme, useThemedStyles, type ThemeColors } from '@velopx/shared'

interface Order {
  id: string
  status: string
  totalAmount: string
  currency: string
  createdAt: string
  items: Array<{ id: string; quantity: number; part: { name: string } }>
  buyer?: { name: string | null; email: string } | null
  delivery: { id: string; status: string; driver: { name: string | null; email: string } | null } | null
}

interface Driver {
  id: string
  name: string | null
  email: string
}

function statusColors(colors: ThemeColors): Record<string, string> {
  return {
    confirmed: colors.info,
    dispatched: '#8B5CF6',
    delivered: colors.success,
    completed: colors.success,
  }
}

export default function DispatchScreen() {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const STATUS_COLOR = useMemo(() => statusColors(colors), [colors])
  const { apiFetch } = useApi()
  const [orders, setOrders]         = useState<Order[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dispatchModal, setDispatchModal] = useState<{ orderId: string } | null>(null)
  const [drivers, setDrivers]             = useState<Driver[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [dispatching, setDispatching]     = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Order[] }>(
        '/v1/orders?tab=confirmed&view=seller&limit=50',
      )
      setOrders(res.data)
    } catch { /* keep */ } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [apiFetch])

  useEffect(() => { void fetchOrders() }, [fetchOrders])

  const onRefresh = () => {
    setRefreshing(true)
    void fetchOrders()
  }

  const openDispatch = async (orderId: string) => {
    setSelectedDriverId('')
    setDispatchModal({ orderId })
    setLoadingDrivers(true)
    try {
      const res = await apiFetch<{ data: Driver[] }>('/v1/deliveries/drivers')
      setDrivers(res.data)
    } catch { /* keep */ } finally {
      setLoadingDrivers(false)
    }
  }

  const createDelivery = async () => {
    if (!dispatchModal || !selectedDriverId) {
      Alert.alert('Select a driver')
      return
    }
    setDispatching(true)
    try {
      const created = await apiFetch<{ data: { id: string } }>('/v1/deliveries', {
        method: 'POST',
        body: JSON.stringify({ orderId: dispatchModal.orderId }),
      })
      await apiFetch(`/v1/deliveries/${created.data.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'assigned', driverId: selectedDriverId }),
      })
      setDispatchModal(null)
      setLoading(true)
      void fetchOrders()
    } catch (err) {
      Alert.alert('Failed to dispatch', (err as Error).message)
    } finally {
      setDispatching(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Dispatch</Text>
        <Text style={styles.subtitle}>Confirmed orders awaiting dispatch</Text>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.orange500} />
        </View>
      )}

      {!loading && orders.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.empty}>No confirmed orders awaiting dispatch</Text>
        </View>
      )}

      {!loading && (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange500} />
          }
          renderItem={({ item: order }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.buyerName} numberOfLines={1}>
                    {order.buyer?.name ?? order.buyer?.email ?? 'Buyer'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.amount}>
                    {order.currency} {Number(order.totalAmount).toLocaleString()}
                  </Text>
                  <Text style={[styles.statusBadge, { color: STATUS_COLOR[order.status] ?? colors.textSecondary }]}>
                    {order.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.parts} numberOfLines={2}>
                {order.items.map((i) => `${i.quantity}× ${i.part.name}`).join(', ')}
              </Text>

              {order.delivery ? (
                <View style={styles.deliveryBadge}>
                  <Text style={styles.deliveryText}>
                    Driver: {order.delivery.driver?.name ?? order.delivery.driver?.email ?? 'Assigned'} · {order.delivery.status.toUpperCase()}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.dispatchBtn}
                  onPress={() => { void openDispatch(order.id) }}
                >
                  <Text style={styles.dispatchBtnText}>Assign Driver & Dispatch</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      <Modal
        visible={!!dispatchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setDispatchModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Assign Driver</Text>
            <Text style={styles.modalSub}>Select a registered driver for this delivery</Text>
            {loadingDrivers ? (
              <ActivityIndicator color={colors.orange500} style={{ marginVertical: 16 }} />
            ) : drivers.length === 0 ? (
              <Text style={[styles.modalSub, { color: colors.textSecondary, textAlign: 'center', marginVertical: 16 }]}>
                No registered drivers available
              </Text>
            ) : (
              <View style={styles.driverList}>
                {drivers.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.driverRow, selectedDriverId === d.id && styles.driverRowSelected]}
                    onPress={() => setSelectedDriverId(d.id)}
                  >
                    <Text style={[styles.driverRowText, selectedDriverId === d.id && styles.driverRowTextSelected]}>
                      {d.name ?? d.email}
                    </Text>
                    {selectedDriverId === d.id && (
                      <Text style={{ color: colors.orange500, fontSize: 16 }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDispatchModal(null)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, dispatching && styles.disabled]}
                onPress={() => { void createDelivery() }}
                disabled={dispatching}
              >
                {dispatching
                  ? <ActivityIndicator color={colors.navy900} size="small" />
                  : <Text style={styles.confirmText}>Dispatch</Text>}
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
    safe:          { flex: 1, backgroundColor: c.navy900 },
    header:        { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    title:         { fontSize: 20, fontWeight: '700', color: c.textPrimary },
    subtitle:      { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    empty:         { color: c.textSecondary, fontSize: 14, textAlign: 'center' },
    list:          { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
    card:          { backgroundColor: c.navy800, borderRadius: 12, padding: 16, gap: 10 },
    cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardLeft:      { gap: 2 },
    orderId:       { fontSize: 13, fontWeight: '700', color: c.textPrimary, fontFamily: 'monospace' },
    buyerName:     { fontSize: 12, color: c.textSecondary },
    amount:        { fontSize: 14, fontWeight: '700', color: c.textPrimary, textAlign: 'right' },
    statusBadge:   { fontSize: 10, fontWeight: '700', textAlign: 'right', marginTop: 2 },
    parts:         { fontSize: 12, color: c.textSecondary, lineHeight: 18 },
    deliveryBadge: { backgroundColor: c.navy700, borderRadius: 8, padding: 8 },
    deliveryText:  { fontSize: 12, color: c.textSecondary },
    dispatchBtn:   { backgroundColor: c.orange500, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
    dispatchBtnText:{ color: c.navy900, fontWeight: '700', fontSize: 13 },
    modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalBox:      { backgroundColor: c.navy800, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
    modalTitle:    { fontSize: 17, fontWeight: '700', color: c.textPrimary },
    modalSub:      { fontSize: 13, color: c.textSecondary },
    driverList:    { gap: 8, maxHeight: 200 },
    driverRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.navy700, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
    driverRowSelected: { backgroundColor: c.orange500 + '22', borderWidth: 1, borderColor: c.orange500 },
    driverRowText: { fontSize: 14, color: c.textPrimary },
    driverRowTextSelected: { color: c.orange500, fontWeight: '700' },
    modalButtons:  { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn:     { flex: 1, backgroundColor: c.navy700, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
    cancelText:    { color: c.textPrimary, fontWeight: '600' },
    confirmBtn:    { flex: 1, backgroundColor: c.orange500, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
    confirmText:   { color: c.navy900, fontWeight: '700' },
    disabled:      { opacity: 0.5 },
  })
}
