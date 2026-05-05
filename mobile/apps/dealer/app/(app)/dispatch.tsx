import { useCallback, useEffect, useState } from 'react'
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
import { Colors, useApi } from '@velopx/shared'

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

const STATUS_COLOR: Record<string, string> = {
  confirmed:  Colors.info,
  dispatched: '#8B5CF6',
  delivered:  Colors.success,
  completed:  Colors.success,
}

export default function DispatchScreen() {
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
      // Confirmed orders are paid + awaiting dispatch
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
      // Step 1 — create the delivery
      const created = await apiFetch<{ data: { id: string } }>('/v1/deliveries', {
        method: 'POST',
        body: JSON.stringify({ orderId: dispatchModal.orderId }),
      })
      // Step 2 — assign the driver
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
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Dispatch</Text>
        <Text style={s.subtitle}>Confirmed orders awaiting dispatch</Text>
      </View>

      {loading && (
        <View style={s.center}>
          <ActivityIndicator color={Colors.orange500} />
        </View>
      )}

      {!loading && orders.length === 0 && (
        <View style={s.center}>
          <Text style={s.empty}>No confirmed orders awaiting dispatch</Text>
        </View>
      )}

      {!loading && (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange500} />
          }
          renderItem={({ item: order }) => (
            <View style={s.card}>
              {/* Top row */}
              <View style={s.cardTop}>
                <View style={s.cardLeft}>
                  <Text style={s.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                  <Text style={s.buyerName} numberOfLines={1}>
                    {order.buyer?.name ?? order.buyer?.email ?? 'Buyer'}
                  </Text>
                </View>
                <View>
                  <Text style={s.amount}>
                    {order.currency} {Number(order.totalAmount).toLocaleString()}
                  </Text>
                  <Text style={[s.statusBadge, { color: STATUS_COLOR[order.status] ?? Colors.textSecondary }]}>
                    {order.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Parts summary */}
              <Text style={s.parts} numberOfLines={2}>
                {order.items.map((i) => `${i.quantity}× ${i.part.name}`).join(', ')}
              </Text>

              {/* Delivery status or assign button */}
              {order.delivery ? (
                <View style={s.deliveryBadge}>
                  <Text style={s.deliveryText}>
                    Driver: {order.delivery.driver?.name ?? order.delivery.driver?.email ?? 'Assigned'} · {order.delivery.status.toUpperCase()}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={s.dispatchBtn}
                  onPress={() => { void openDispatch(order.id) }}
                >
                  <Text style={s.dispatchBtnText}>Assign Driver & Dispatch</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {/* Assign driver modal */}
      <Modal
        visible={!!dispatchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setDispatchModal(null)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Assign Driver</Text>
            <Text style={s.modalSub}>Select a registered driver for this delivery</Text>
            {loadingDrivers ? (
              <ActivityIndicator color={Colors.orange500} style={{ marginVertical: 16 }} />
            ) : drivers.length === 0 ? (
              <Text style={[s.modalSub, { color: Colors.textSecondary, textAlign: 'center', marginVertical: 16 }]}>
                No registered drivers available
              </Text>
            ) : (
              <View style={s.driverList}>
                {drivers.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[s.driverRow, selectedDriverId === d.id && s.driverRowSelected]}
                    onPress={() => setSelectedDriverId(d.id)}
                  >
                    <Text style={[s.driverRowText, selectedDriverId === d.id && s.driverRowTextSelected]}>
                      {d.name ?? d.email}
                    </Text>
                    {selectedDriverId === d.id && (
                      <Text style={{ color: Colors.orange500, fontSize: 16 }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={s.modalButtons}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setDispatchModal(null)}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, dispatching && s.disabled]}
                onPress={() => { void createDelivery() }}
                disabled={dispatching}
              >
                {dispatching
                  ? <ActivityIndicator color={Colors.navy900} size="small" />
                  : <Text style={s.confirmText}>Dispatch</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.navy900 },
  header:        { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title:         { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle:      { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  empty:         { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  list:          { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card:          { backgroundColor: Colors.navy800, borderRadius: 12, padding: 16, gap: 10 },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft:      { gap: 2 },
  orderId:       { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'monospace' },
  buyerName:     { fontSize: 12, color: Colors.textSecondary },
  amount:        { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right' },
  statusBadge:   { fontSize: 10, fontWeight: '700', textAlign: 'right', marginTop: 2 },
  parts:         { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  deliveryBadge: { backgroundColor: Colors.navy700, borderRadius: 8, padding: 8 },
  deliveryText:  { fontSize: 12, color: Colors.textSecondary },
  dispatchBtn:   { backgroundColor: Colors.orange500, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  dispatchBtnText:{ color: Colors.navy900, fontWeight: '700', fontSize: 13 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox:      { backgroundColor: Colors.navy800, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalTitle:    { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  modalSub:      { fontSize: 13, color: Colors.textSecondary },
  input:         { backgroundColor: Colors.navy700, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.textPrimary },
  driverList:    { gap: 8, maxHeight: 200 },
  driverRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.navy700, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  driverRowSelected: { backgroundColor: Colors.orange500 + '22', borderWidth: 1, borderColor: Colors.orange500 },
  driverRowText: { fontSize: 14, color: Colors.textPrimary },
  driverRowTextSelected: { color: Colors.orange500, fontWeight: '700' },
  modalButtons:  { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:     { flex: 1, backgroundColor: Colors.navy700, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  cancelText:    { color: Colors.textPrimary, fontWeight: '600' },
  confirmBtn:    { flex: 1, backgroundColor: Colors.orange500, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  confirmText:   { color: Colors.navy900, fontWeight: '700' },
  disabled:      { opacity: 0.5 },
})
