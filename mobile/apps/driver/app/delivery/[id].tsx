import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, useApi } from '@velopx/shared'

const MAP_HEIGHT = Dimensions.get('window').height * 0.35
const GPS_INTERVAL_MS = 15_000

// ── Types ──────────────────────────────────────────────────────────────────

type DeliveryStatus =
  | 'assigned'
  | 'collected'
  | 'in_transit'
  | 'delivered'
  | 'confirmed'
  | 'disputed'

interface OrderItem {
  id: string
  quantity: number
  part: { id: string; name: string }
}

interface DeliveryDetail {
  id: string
  status: DeliveryStatus
  proofUrl: string | null
  note: string | null
  createdAt: string
  customerName: string
  pickupAddress: string
  deliveryAddress: string
  destination: { lat: number; lng: number }
  order: {
    id: string
    claimReference: string | null
    totalAmount: string
    currency: string
    items: OrderItem[]
  }
}

// ── Constants ───────────────────────────────────────────────────────────────

const NAIROBI_CBD = { latitude: -1.2921, longitude: 36.8219 }

const STATUS_COLOR: Record<DeliveryStatus, string> = {
  assigned:   Colors.info,
  collected:  Colors.warning,
  in_transit: '#8B5CF6',
  delivered:  Colors.success,
  confirmed:  Colors.success,
  disputed:   Colors.error,
}

const STEPS = ['assigned', 'collected', 'in_transit', 'delivered', 'confirmed'] as const
const STEP_LABELS = ['Assigned', 'Collected', 'In Transit', 'Delivered', 'Confirmed']

// ── Mock data map (DEV only) ────────────────────────────────────────────────

const MOCK_MAP: Record<string, DeliveryDetail> = __DEV__ ? {
  'mock-001': {
    id: 'mock-001',
    status: 'assigned',
    proofUrl: null,
    note: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    customerName: 'AutoFix Garage – Westlands',
    pickupAddress: '14 Industrial Area Rd, Nairobi',
    deliveryAddress: 'Waiyaki Way, Westlands, Nairobi',
    destination: { lat: NAIROBI_CBD.latitude, lng: NAIROBI_CBD.longitude },
    order: {
      id: 'ord-a1b2c3d4',
      claimReference: 'CLM-2026-00142',
      totalAmount: '18500',
      currency: 'KES',
      items: [
        { id: 'i1', quantity: 2, part: { id: 'p1', name: 'Brake Pad Set (Front)' } },
        { id: 'i2', quantity: 1, part: { id: 'p2', name: 'Brake Disc' } },
      ],
    },
  },
  'mock-002': {
    id: 'mock-002',
    status: 'in_transit',
    proofUrl: null,
    note: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    customerName: 'Kariuki Motors – Ngong Rd',
    pickupAddress: 'Mombasa Rd Warehouse, Nairobi',
    deliveryAddress: 'Ngong Road, Karen, Nairobi',
    destination: { lat: NAIROBI_CBD.latitude, lng: NAIROBI_CBD.longitude },
    order: {
      id: 'ord-e5f6g7h8',
      claimReference: null,
      totalAmount: '7200',
      currency: 'KES',
      items: [
        { id: 'i3', quantity: 1, part: { id: 'p3', name: 'Oil Filter' } },
        { id: 'i4', quantity: 4, part: { id: 'p4', name: 'Engine Oil (1L)' } },
      ],
    },
  },
  'mock-003': {
    id: 'mock-003',
    status: 'collected',
    proofUrl: null,
    note: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    customerName: 'Ndegwa Auto Spares – CBD',
    pickupAddress: 'Kirinyaga Rd, Nairobi CBD',
    deliveryAddress: 'Ronald Ngala St, Nairobi CBD',
    destination: { lat: NAIROBI_CBD.latitude, lng: NAIROBI_CBD.longitude },
    order: {
      id: 'ord-i9j0k1l2',
      claimReference: 'CLM-2026-00139',
      totalAmount: '32000',
      currency: 'KES',
      items: [
        { id: 'i5', quantity: 1, part: { id: 'p5', name: 'Alternator' } },
      ],
    },
  },
  'mock-004': {
    id: 'mock-004',
    status: 'delivered',
    proofUrl: 'https://example.com/proof.jpg',
    note: 'Left with reception',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    customerName: 'Premier Car Services – Upperhill',
    pickupAddress: 'Enterprise Rd, Industrial Area, Nairobi',
    deliveryAddress: 'Upper Hill, Nairobi',
    destination: { lat: NAIROBI_CBD.latitude, lng: NAIROBI_CBD.longitude },
    order: {
      id: 'ord-m3n4o5p6',
      claimReference: null,
      totalAmount: '4500',
      currency: 'KES',
      items: [
        { id: 'i6', quantity: 2, part: { id: 'p6', name: 'Wiper Blade' } },
      ],
    },
  },
} : {}

function createMockDelivery(id: string): DeliveryDetail {
  return {
    id,
    status: 'in_transit',
    proofUrl: null,
    note: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    customerName: 'Garage Plus – Industrial Area',
    pickupAddress: 'Westlands Auto Parts, Waiyaki Way, Nairobi',
    deliveryAddress: 'Garage Plus, Industrial Area, Nairobi',
    destination: { lat: -1.3036, lng: 36.8219 },
    order: {
      id: `ord-${id}`,
      claimReference: 'CLM-2026-00142',
      totalAmount: '18500',
      currency: 'KES',
      items: [
        { id: 'i1', quantity: 2, part: { id: 'p1', name: 'Brake Pad Set (Front)' } },
        { id: 'i2', quantity: 1, part: { id: 'p2', name: 'Brake Disc' } },
      ],
    },
  }
}

// ── Screen ──────────────────────────────────────────────────────────────────

export default function DeliveryDetailScreen() {
  const { id }       = useLocalSearchParams<{ id: string }>()
  const { apiFetch } = useApi()
  const router       = useRouter()
  const mapRef       = useRef<MapView>(null)
  const gpsInterval  = useRef<ReturnType<typeof setInterval> | null>(null)

  const [delivery, setDelivery]         = useState<DeliveryDetail | null>(
    __DEV__ ? (MOCK_MAP[id] ?? createMockDelivery(id)) : null,
  )
  const [loading, setLoading]           = useState(!__DEV__)
  const [driverPos, setDriverPos]       = useState(NAIROBI_CBD)
  const [gpsActive, setGpsActive]       = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)
  const [proofVisible, setProofVisible] = useState(false)
  const [proofImage, setProofImage]     = useState<string | null>(null)
  const [proofNote, setProofNote]       = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [advancing, setAdvancing]       = useState(false)

  // Fetch real delivery detail (production)
  useEffect(() => {
    if (__DEV__) return
    apiFetch<{ data: DeliveryDetail }>(`/v1/deliveries/${id}`)
      .then((res) => setDelivery(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, apiFetch])

  // GPS tracking + 15s ping (active when assigned or in_transit)
  const deliveryStatus = delivery?.status
  useEffect(() => {
    if (deliveryStatus !== 'assigned' && deliveryStatus !== 'in_transit') return

    let cancelled = false

    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setLocationDenied(true)
        return
      }

      // Get initial position
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      if (cancelled) return

      const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
      setDriverPos(pos)
      setGpsActive(true)

      // Ping every 15 seconds
      gpsInterval.current = setInterval(async () => {
        try {
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })
          const driverLat = current.coords.latitude
          const driverLng = current.coords.longitude
          setDriverPos({ latitude: driverLat, longitude: driverLng })
          if (!__DEV__) {
            await apiFetch(`/v1/deliveries/${id}/location`, {
              method: 'PATCH',
              body: JSON.stringify({ lat: driverLat, lng: driverLng }),
            })
          }
        } catch {
          // non-fatal — keep interval running
        }
      }, GPS_INTERVAL_MS)
    })()

    return () => {
      cancelled = true
      if (gpsInterval.current) {
        clearInterval(gpsInterval.current)
        gpsInterval.current = null
      }
      setGpsActive(false)
    }
  }, [deliveryStatus, id, apiFetch])

  // Fit map to show both markers once delivery loads
  useEffect(() => {
    if (!delivery) return
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        [
          driverPos,
          { latitude: delivery.destination.lat, longitude: delivery.destination.lng },
        ],
        { edgePadding: { top: 80, right: 60, bottom: 80, left: 60 }, animated: true },
      )
    }, 800)
    return () => clearTimeout(timer)
  }, [delivery, driverPos])

  async function captureProof() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    })
    if (!result.canceled) setProofImage(result.assets[0].uri)
  }

  async function confirmPickup() {
    if (!delivery) return
    setAdvancing(true)
    try {
      if (!__DEV__) {
        await apiFetch(`/v1/deliveries/${delivery.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'collected' }),
        })
      }
      setDelivery((d) => (d ? { ...d, status: 'collected' } : d))
    } catch {
      Alert.alert('Error', 'Failed to confirm pickup. Please try again.')
    } finally {
      setAdvancing(false)
    }
  }

  async function confirmInTransit() {
    if (!delivery) return
    setAdvancing(true)
    try {
      if (!__DEV__) {
        await apiFetch(`/v1/deliveries/${delivery.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'in_transit' }),
        })
      }
      setDelivery((d) => (d ? { ...d, status: 'in_transit' } : d))
    } catch {
      Alert.alert('Error', 'Failed to update status. Please try again.')
    } finally {
      setAdvancing(false)
    }
  }

  const confirmDelivery = useCallback(async () => {
    if (!delivery) return
    if (!proofImage) {
      Alert.alert('Photo required', 'Please capture a proof photo before confirming delivery.')
      return
    }
    setSubmitting(true)
    try {
      if (!__DEV__) {
        // TODO: upload to storage and use returned URL before production
        await apiFetch(`/v1/deliveries/${delivery.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'delivered', note: proofNote, proofUrl: proofImage }),
        })
      }
      setDelivery((d) => (d ? { ...d, status: 'delivered' } : d))
      setProofVisible(false)
      Alert.alert('Delivery confirmed ✓', 'The order has been marked as delivered.')
      setTimeout(() => router.back(), 1500)
    } catch {
      Alert.alert('Error', 'Failed to update delivery. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [delivery, proofImage, proofNote, apiFetch, router])

  if (loading || !delivery) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.orange500} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  const destCoord   = { latitude: delivery.destination.lat, longitude: delivery.destination.lng }
  const stepIdx     = STEPS.indexOf(delivery.status as typeof STEPS[number])
  const statusColor = STATUS_COLOR[delivery.status] ?? Colors.textMuted
  const orderRef    = delivery.order.claimReference ?? `#${delivery.order.id.slice(0, 8)}`
  const canCapture  = delivery.status === 'collected' || delivery.status === 'in_transit'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{orderRef}</Text>
        {gpsActive && (
          <View style={styles.gpsActiveBadge}>
            <View style={styles.gpsDot} />
            <Text style={styles.gpsActiveText}>GPS</Text>
          </View>
        )}
        <View style={[styles.statusChip, { borderColor: statusColor }]}>
          <Text style={[styles.statusChipText, { color: statusColor }]}>
            {delivery.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {/* ── Map ── */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{ ...driverPos, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
        >
          {/* Driver marker — blue pin */}
          <Marker coordinate={driverPos} title="You (Driver)">
            <View style={styles.driverMarker} />
          </Marker>

          {/* Destination marker — red pin */}
          <Marker coordinate={destCoord} title="Destination">
            <View style={styles.destMarker} />
          </Marker>
        </MapView>

        {locationDenied && (
          <View style={styles.locationDeniedBadge}>
            <Text style={styles.locationDeniedText}>Location access denied</Text>
          </View>
        )}

        {__DEV__ && (
          <View style={styles.mockBadge}>
            <Text style={styles.mockBadgeText}>⚠ MOCK DATA</Text>
          </View>
        )}
      </View>

      {/* ── Bottom panel ── */}
      <ScrollView
        style={styles.panel}
        contentContainerStyle={styles.panelContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress bar */}
        <View style={styles.progressRow}>
          {STEPS.map((step, i) => (
            <View
              key={step}
              style={[
                styles.progressSeg,
                i < stepIdx  ? styles.progressSegDone
                : i === stepIdx ? styles.progressSegActive
                : styles.progressSegPending,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressLabel}>
          {stepIdx >= 0
            ? `Step ${stepIdx + 1} of ${STEPS.length} — ${STEP_LABELS[stepIdx]}`
            : delivery.status}
        </Text>

        {/* Delivery info card */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionLabel}>CUSTOMER</Text>
          <Text style={styles.infoValue}>{delivery.customerName}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>PICKUP ADDRESS</Text>
          <Text style={styles.infoValue}>{delivery.pickupAddress}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>DELIVERY ADDRESS</Text>
          <Text style={styles.infoValue}>{delivery.deliveryAddress}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>ITEMS ({delivery.order.items.length})</Text>
          {delivery.order.items.map((item) => (
            <Text key={item.id} style={styles.itemLine}>
              · {item.part.name} ×{item.quantity}
            </Text>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalAmt}>
              {delivery.order.currency} {Number(delivery.order.totalAmount).toLocaleString()}
            </Text>
            {delivery.order.claimReference && (
              <Text style={styles.claimRef}>{delivery.order.claimReference}</Text>
            )}
          </View>
        </View>

        {/* Proof capture (collected or in_transit) */}
        {canCapture && (
          <View style={styles.proofSection}>
            <Text style={styles.sectionLabel}>PROOF OF DELIVERY</Text>
            <TouchableOpacity style={styles.captureBtn} onPress={captureProof}>
              <Text style={styles.captureBtnText}>📷  Capture Proof Photo</Text>
            </TouchableOpacity>
            {proofImage && (
              <Image
                source={{ uri: proofImage }}
                style={styles.proofThumbnail}
                resizeMode="cover"
              />
            )}
          </View>
        )}

        {/* Action buttons */}
        {delivery.status === 'assigned' && (
          <TouchableOpacity
            style={[styles.ctaBtn, advancing && styles.btnDisabled]}
            onPress={confirmPickup}
            disabled={advancing}
          >
            {advancing
              ? <ActivityIndicator color={Colors.navy950} />
              : <Text style={styles.ctaBtnText}>Mark as Collected</Text>
            }
          </TouchableOpacity>
        )}

        {delivery.status === 'collected' && (
          <TouchableOpacity
            style={[styles.ctaBtn, advancing && styles.btnDisabled]}
            onPress={confirmInTransit}
            disabled={advancing}
          >
            {advancing
              ? <ActivityIndicator color={Colors.navy950} />
              : <Text style={styles.ctaBtnText}>Mark In Transit</Text>
            }
          </TouchableOpacity>
        )}

        {delivery.status === 'in_transit' && (
          <TouchableOpacity
            style={[styles.ctaBtn, submitting && styles.btnDisabled]}
            onPress={() => setProofVisible(true)}
            disabled={submitting}
          >
            <Text style={styles.ctaBtnText}>Mark Delivered + Add Proof →</Text>
          </TouchableOpacity>
        )}

        {delivery.status === 'delivered' && (
          <View style={[styles.ctaBtn, styles.ctaBtnDelivered]}>
            <Text style={styles.ctaBtnDeliveredText}>Delivery Complete ✓</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Proof confirm modal ── */}
      <Modal
        visible={proofVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProofVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Delivery</Text>
              <TouchableOpacity
                onPress={() => setProofVisible(false)}
                hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {proofImage ? (
              <Image source={{ uri: proofImage }} style={styles.proofPreview} resizeMode="cover" />
            ) : (
              <TouchableOpacity style={styles.proofPlaceholder} onPress={captureProof}>
                <Text style={styles.proofPlaceholderIcon}>📷</Text>
                <Text style={styles.proofPlaceholderText}>Tap to capture proof photo (required)</Text>
              </TouchableOpacity>
            )}

            <TextInput
              style={styles.noteInput}
              placeholder="Note (optional) — e.g. Left with receptionist…"
              placeholderTextColor={Colors.textMuted}
              value={proofNote}
              onChangeText={setProofNote}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.confirmBtn, (!proofImage || submitting) && styles.btnDisabled]}
              onPress={confirmDelivery}
              disabled={!proofImage || submitting}
            >
              {submitting
                ? <ActivityIndicator color={Colors.navy950} />
                : <Text style={styles.confirmBtnText}>Confirm Delivery</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy950 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  backBtn:     { padding: 4 },
  backArrow:   { fontSize: 22, color: Colors.textPrimary },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  statusChip:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusChipText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  // GPS badge
  gpsActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  gpsDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  gpsActiveText:{ fontSize: 10, fontWeight: '700', color: Colors.success },

  // Map
  mapContainer: { position: 'relative' },
  map:          { width: '100%', height: MAP_HEIGHT },

  driverMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.info,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  destMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.white,
  },

  locationDeniedBadge: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(239,68,68,0.88)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  locationDeniedText: { fontSize: 11, fontWeight: '700', color: Colors.white },

  mockBadge: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(245,166,35,0.88)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mockBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.navy950 },

  // Panel
  panel:        { flex: 1, backgroundColor: Colors.navy950 },
  panelContent: { padding: 20, paddingBottom: 48 },

  // Progress
  progressRow:        { flexDirection: 'row', gap: 4, marginBottom: 6 },
  progressSeg:        { flex: 1, height: 6, borderRadius: 3 },
  progressSegDone:    { backgroundColor: Colors.success },
  progressSegActive:  { backgroundColor: Colors.orange500 },
  progressSegPending: { backgroundColor: Colors.navy700 },
  progressLabel:      { fontSize: 12, color: Colors.textSecondary },

  // Info card
  infoCard: {
    backgroundColor: Colors.navy900,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.navy700,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  divider:   { height: 1, backgroundColor: Colors.navy700, marginVertical: 12 },
  itemLine:  { fontSize: 13, color: Colors.textSecondary, marginBottom: 3 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.navy700,
  },
  totalAmt: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  claimRef: { fontSize: 12, color: Colors.textSecondary },

  // Proof section
  proofSection: { marginTop: 20 },
  captureBtn: {
    backgroundColor: Colors.navy800,
    borderWidth: 1,
    borderColor: Colors.navy700,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  captureBtnText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600' },
  proofThumbnail: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: Colors.navy800,
  },

  // Action buttons
  ctaBtn: {
    backgroundColor: Colors.orange500,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  ctaBtnText: { color: Colors.navy950, fontSize: 15, fontWeight: '700' },
  ctaBtnDelivered: {
    backgroundColor: Colors.navy800,
    borderWidth: 1,
    borderColor: Colors.success,
    opacity: 1,
  },
  ctaBtnDeliveredText: { color: Colors.success, fontSize: 15, fontWeight: '600' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.navy900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 44,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 18, color: Colors.textSecondary },

  proofPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: Colors.navy800,
  },
  proofPlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.navy800,
    borderWidth: 1,
    borderColor: Colors.navy700,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  proofPlaceholderIcon: { fontSize: 28 },
  proofPlaceholderText: { color: Colors.textMuted, fontSize: 13 },

  noteInput: {
    backgroundColor: Colors.navy800,
    borderWidth: 1,
    borderColor: Colors.navy700,
    borderRadius: 10,
    color: Colors.textPrimary,
    padding: 12,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  confirmBtn: {
    backgroundColor: Colors.orange500,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: { color: Colors.navy950, fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
})
