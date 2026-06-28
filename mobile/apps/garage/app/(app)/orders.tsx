import {useCallback, useEffect, useState, useMemo} from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApi, Input, useTheme, useThemedStyles, type ThemeColors} from '@velopx/shared'

// expo-location: GPS works only after expo prebuild + rebuild. Degrades gracefully.
let Location: typeof import('expo-location') | null = null
try { Location = require('expo-location') } catch { /* not yet compiled */ }

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
  delivery:        { id: string; status: string } | null
  deliveryLat:     number | null
  deliveryLng:     number | null
  deliveryAddress: string | null
}

interface LocationEditState {
  open:       boolean
  lat:        string
  lng:        string
  address:    string
  saving:     boolean
  gpsLoading: boolean
}

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



function deliveryStatusColors(colors: ThemeColors): Record<string, string> {
  return {
  pending:    colors.textMuted,
  assigned:   colors.info,
  collected:  colors.warning,
  in_transit: '#8B5CF6',
  delivered:  colors.success,
  confirmed:  colors.success,
  disputed:   colors.error,
  }
}



export default function GarageOrdersScreen() {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const STATUS_COLOR = useMemo(() => orderStatusColors(colors), [colors])
  const DELIVERY_STATUS_COLOR = useMemo(() => deliveryStatusColors(colors), [colors])
  const { apiFetch } = useApi()
  const [orders, setOrders]     = useState<Order[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore]   = useState(false)
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [query, setQueryState]  = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [locEdit, setLocEdit]   = useState<Record<string, LocationEditState>>({})

  const PAGE_LIMIT = 20

  function toggleLocationForm(orderId: string, order: Order) {
    setLocEdit((prev) => ({
      ...prev,
      [orderId]: prev[orderId]?.open
        ? { ...prev[orderId], open: false }
        : {
            open:       true,
            lat:        order.deliveryLat  != null ? String(order.deliveryLat)  : '',
            lng:        order.deliveryLng  != null ? String(order.deliveryLng)  : '',
            address:    order.deliveryAddress ?? '',
            saving:     false,
            gpsLoading: false,
          },
    }))
  }

  function patchLocEdit(orderId: string, patch: Partial<LocationEditState>) {
    setLocEdit((prev) => ({ ...prev, [orderId]: { ...prev[orderId], ...patch } }))
  }

  async function detectGPS(orderId: string) {
    if (!Location) {
      Alert.alert('GPS unavailable', 'GPS requires a native rebuild. Enter address manually.')
      return
    }
    patchLocEdit(orderId, { gpsLoading: true })
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { patchLocEdit(orderId, { gpsLoading: false }); return }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const latStr = String(pos.coords.latitude)
      const lngStr = String(pos.coords.longitude)
      const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      const addr = geo
        ? [geo.streetNumber, geo.street, geo.district ?? geo.subregion, geo.city].filter(Boolean).join(', ')
        : ''
      patchLocEdit(orderId, { lat: latStr, lng: lngStr, address: addr, gpsLoading: false })
    } catch { patchLocEdit(orderId, { gpsLoading: false }) }
  }

  async function saveOrderLocation(orderId: string) {
    const edit = locEdit[orderId]
    if (!edit) return
    const latNum = edit.lat.trim() ? parseFloat(edit.lat) : NaN
    const lngNum = edit.lng.trim() ? parseFloat(edit.lng) : NaN
    if (isNaN(latNum) || isNaN(lngNum)) {
      Alert.alert('Invalid coordinates', 'Enter valid latitude and longitude numbers.')
      return
    }
    patchLocEdit(orderId, { saving: true })
    try {
      await apiFetch(`/v1/orders/${orderId}/delivery-location`, {
        method: 'PATCH',
        body: JSON.stringify({ lat: latNum, lng: lngNum, address: edit.address.trim() || undefined }),
      })
      patchLocEdit(orderId, { open: false, saving: false })
      await fetchOrders(query, 1, false)
    } catch {
      patchLocEdit(orderId, { saving: false })
      Alert.alert('Save failed', 'Could not save location. Try again.')
    }
  }

  const fetchOrders = useCallback(async (q: string, pg: number, append: boolean) => {
    const params = new URLSearchParams({ limit: String(PAGE_LIMIT), page: String(pg) })
    if (q.trim()) params.set('q', q.trim())
    const res = await apiFetch<{ data: Order[]; meta: { total: number; page: number; pages: number } }>(`/v1/orders?${params}`)
    setTotal(res.meta.total)
    setHasMore(res.meta.page < res.meta.pages)
    setPage(res.meta.page)
    if (append) {
      setOrders((prev) => [...prev, ...res.data])
    } else {
      setOrders(res.data)
    }
  }, [apiFetch])

  useEffect(() => {
    fetchOrders('', 1, false).finally(() => setLoading(false))
  }, [fetchOrders])

  async function onRefresh() {
    setRefreshing(true)
    await fetchOrders(query, 1, false)
    setRefreshing(false)
  }

  async function onLoadMore() {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    await fetchOrders(query, page + 1, true)
    setLoadingMore(false)
  }

  function setQuery(q: string) {
    setQueryState(q)
    setLoading(true)
    fetchOrders(q, 1, false).finally(() => setLoading(false))
  }

  async function confirmDelivery(deliveryId: string) {
    setUpdatingId(deliveryId)
    try {
      await apiFetch(`/v1/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'confirmed' }),
      })
      await fetchOrders(query, 1, false)
    } finally {
      setUpdatingId(null)
    }
  }

  function disputeDelivery(deliveryId: string) {
    Alert.prompt(
      'Dispute Delivery',
      'Describe the issue with this delivery:',
      async (note) => {
        if (note === null || note === undefined || note.trim() === '') return
        setUpdatingId(deliveryId)
        try {
          await apiFetch(`/v1/deliveries/${deliveryId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'disputed', note: note.trim() }),
          })
          await fetchOrders(query, 1, false)
        } finally {
          setUpdatingId(null)
        }
      },
      'plain-text',
    )
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

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange500} />}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No orders yet.</Text>
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
                <Text style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
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

            {/* Per-order delivery location — only for orders without a delivery yet */}
            {!item.delivery && (
              <View style={styles.locSection}>
                {item.deliveryAddress || item.deliveryLat != null ? (
                  <View style={styles.locSet}>
                    <Text style={styles.locSetLabel}>📍 Delivery location set</Text>
                    <Text style={styles.locSetValue} numberOfLines={1}>
                      {item.deliveryAddress ?? `${item.deliveryLat?.toFixed(4)}, ${item.deliveryLng?.toFixed(4)}`}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={styles.locBtn}
                  onPress={() => toggleLocationForm(item.id, item)}
                >
                  <Text style={styles.locBtnText}>
                    {locEdit[item.id]?.open ? '✕ Cancel' : '📍 Set Delivery Location'}
                  </Text>
                </TouchableOpacity>

                {locEdit[item.id]?.open && (
                  <View style={styles.locForm}>
                    <Input
                      label="Street Address"
                      value={locEdit[item.id].address}
                      onChangeText={(v) => patchLocEdit(item.id, { address: v })}
                      placeholder="e.g. 14 Liberation Road, Accra"
                    />
                    <View style={styles.coordRow}>
                      <View style={styles.coordHalf}>
                        <Input
                          label="Latitude"
                          value={locEdit[item.id].lat}
                          onChangeText={(v) => patchLocEdit(item.id, { lat: v })}
                          placeholder="5.6037"
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View style={styles.coordHalf}>
                        <Input
                          label="Longitude"
                          value={locEdit[item.id].lng}
                          onChangeText={(v) => patchLocEdit(item.id, { lng: v })}
                          placeholder="-0.1870"
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                    <View style={styles.locActions}>
                      <TouchableOpacity
                        style={[styles.locGpsBtn, locEdit[item.id].gpsLoading && styles.btnDisabled]}
                        onPress={() => detectGPS(item.id)}
                        disabled={locEdit[item.id].gpsLoading}
                      >
                        {locEdit[item.id].gpsLoading
                          ? <ActivityIndicator color={colors.orange500} size="small" />
                          : <Text style={styles.locGpsBtnText}>📍 GPS</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.locSaveBtn, locEdit[item.id].saving && styles.btnDisabled]}
                        onPress={() => saveOrderLocation(item.id)}
                        disabled={locEdit[item.id].saving}
                      >
                        <Text style={styles.locSaveBtnText}>
                          {locEdit[item.id].saving ? 'Saving…' : 'Save Location'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {item.delivery && (
              <View style={styles.deliverySection}>
                <View style={styles.deliveryRow}>
                  <Text style={styles.deliveryLabel}>Delivery</Text>
                  <Text style={[
                    styles.deliveryStatus,
                    { color: DELIVERY_STATUS_COLOR[item.delivery.status] ?? colors.textSecondary },
                  ]}>
                    {item.delivery.status.replace('_', ' ')}
                  </Text>
                </View>

                {item.delivery.status === 'delivered' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.disputeBtn, updatingId === item.delivery.id && styles.btnDisabled]}
                      onPress={() => disputeDelivery(item.delivery!.id)}
                      disabled={updatingId === item.delivery!.id}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.error }]}>Dispute</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.confirmBtn, updatingId === item.delivery.id && styles.btnDisabled]}
                      onPress={() => confirmDelivery(item.delivery!.id)}
                      disabled={updatingId === item.delivery!.id}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.navy950 }]}>
                        {updatingId === item.delivery.id ? 'Updating…' : 'Confirm Receipt'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  )
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.navy950 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: c.textPrimary },
  count: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
  list: { padding: 20, gap: 12 },
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
  deliverySection: { gap: 10, paddingTop: 4, borderTopWidth: 1, borderTopColor: c.navy700 },
  deliveryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  deliveryLabel: { fontSize: 12, color: c.textSecondary },
  deliveryStatus: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  confirmBtn: { backgroundColor: c.orange500 },
  disputeBtn: { backgroundColor: c.navy700 },
  btnDisabled: { opacity: 0.5 },
  actionBtnText: { fontWeight: '600', fontSize: 13 },
  emptyBox:      { alignItems: 'center', paddingTop: 60 },
  emptyText:     { color: c.textSecondary, fontSize: 14 },
  searchRow:     { paddingHorizontal: 20, paddingBottom: 12 },
  searchInput:   { backgroundColor: c.navy900, borderWidth: 1, borderColor: c.navy700, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: c.textPrimary },
  loadMoreBtn:   { alignItems: 'center', paddingVertical: 16 },
  loadMoreText:  { fontSize: 14, color: c.orange500, fontWeight: '600' },
  // Location section styles
  locSection:    { paddingTop: 4, borderTopWidth: 1, borderTopColor: c.navy700, gap: 8 },
  locSet:        { backgroundColor: c.navy800, borderRadius: 8, padding: 8 },
  locSetLabel:   { fontSize: 11, color: c.orange500, fontWeight: '600', marginBottom: 2 },
  locSetValue:   { fontSize: 12, color: c.textSecondary },
  locBtn:        { paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: c.navy600, borderRadius: 8 },
  locBtnText:    { fontSize: 13, color: c.orange500, fontWeight: '600' },
  locForm:       { gap: 8, paddingTop: 4 },
  coordRow:      { flexDirection: 'row', gap: 10 },
  coordHalf:     { flex: 1 },
  locActions:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  locGpsBtn:     { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: c.orange500, borderRadius: 8, alignItems: 'center' },
  locGpsBtnText: { fontSize: 13, color: c.orange500, fontWeight: '600' },
  locSaveBtn:    { flex: 2, paddingVertical: 10, backgroundColor: c.orange500, borderRadius: 8, alignItems: 'center' },
  locSaveBtnText:{ fontSize: 13, color: c.navy950, fontWeight: '700' },
})
}
