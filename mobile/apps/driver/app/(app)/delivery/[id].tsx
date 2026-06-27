import * as ImagePicker from 'expo-image-picker'
import { useCallback, useEffect, useState } from 'react'
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
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, useApi } from '@velopx/shared'

const MAP_HEIGHT = Dimensions.get('window').height * 0.35
const GPS_INTERVAL_MS = 15_000

// ── Types ──────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string
  quantity: number
  part: { id: string; name: string }
}

interface DeliveryDetail {
  id: string
  status: string
  proofUrl: string | null
  note: string | null
  createdAt: string
  driverLocation: { lat: number; lng: number } | null
  destination: { lat: number; lng: number; address?: string | null } | null
  source: { lat: number; lng: number; address?: string | null } | null
  order: {
    id: string
    claimReference: string | null
    totalAmount: string
    currency: string
    buyer: { id: string; name: string | null; email: string }
    items: OrderItem[]
  }
}

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_LAT = 5.6037  // Accra, Ghana
const DEFAULT_LNG = -0.187

const STATUS_COLOR: Record<string, string> = {
  assigned:   Colors.info,
  collected:  Colors.warning,
  in_transit: '#8B5CF6',
  delivered:  Colors.success,
  confirmed:  Colors.success,
  disputed:   Colors.error,
}

const STEPS = ['assigned', 'collected', 'in_transit', 'delivered', 'confirmed'] as const
const STEP_LABELS = ['Assigned', 'Collected', 'In Transit', 'Delivered', 'Confirmed']

// ── Screen ──────────────────────────────────────────────────────────────────

export default function DeliveryDetailScreen() {
  const { id }       = useLocalSearchParams<{ id: string }>()
  const { apiFetch } = useApi()
  const router       = useRouter()
  const mapRef       = useRef<MapView>(null)
  const gpsInterval  = useRef<ReturnType<typeof setInterval> | null>(null)

  const [delivery, setDelivery]         = useState<DeliveryDetail | null>(null)
  const [loading, setLoading]           = useState(true)
  const [driverPos, setDriverPos]       = useState({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG })
  const [gpsActive, setGpsActive]       = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)
  const [proofVisible, setProofVisible] = useState(false)
  const [proofImage, setProofImage]     = useState<string | null>(null)
  const [proofNote, setProofNote]       = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [advancing, setAdvancing]       = useState(false)
  const [exceptionVisible, setExceptionVisible] = useState(false)
  const [exceptionType, setExceptionType]       = useState<string>('address_not_found')
  const [exceptionNote, setExceptionNote]       = useState('')
  const [reportingException, setReportingException] = useState(false)

  // Fetch delivery detail
  useEffect(() => {
    apiFetch<{ data: DeliveryDetail }>(`/v1/deliveries/${id}`)
      .then((res) => setDelivery(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, apiFetch])

  async function pickProofPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (!result.canceled && result.assets[0]?.uri) {
      setProofUrl(result.assets[0].uri)
    }
  }

  async function handleMarkDelivered() {
    if (!proofUrl.trim()) {
      Alert.alert('Proof Required', 'Capture or enter proof of delivery before marking as delivered.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    })
    if (!result.canceled) setProofImage(result.assets[0].uri)
  }

  async function confirmPickup() {
    if (!delivery) return
    setAdvancing(true)
    try {
      await apiFetch(`/v1/deliveries/${delivery.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'collected' }),
      })
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
      await apiFetch(`/v1/deliveries/${delivery.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'in_transit' }),
      })
      setDelivery((d) => (d ? { ...d, status: 'in_transit' } : d))
    } catch {
      Alert.alert('Error', 'Failed to update status. Please try again.')
    } finally {
      setAdvancing(false)
    }
  }

  async function reportException() {
    if (!delivery) return
    setReportingException(true)
    try {
      await apiFetch(`/v1/deliveries/${delivery.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'failed',
          failureReason: exceptionType,
          note: exceptionNote.trim() || undefined,
        }),
      })
      setDelivery((d) => (d ? { ...d, status: 'failed' } : d))
      setExceptionVisible(false)
      setExceptionNote('')
      Alert.alert('Exception Reported', 'This delivery has been flagged for follow-up.')
      setTimeout(() => router.replace('/(app)'), 1500)
    } catch {
      Alert.alert('Error', 'Failed to report exception. Please try again.')
    } finally {
      setReportingException(false)
    }
  }

  const confirmDelivery = useCallback(async () => {
    if (!proofImage) {
      Alert.alert('Photo required', 'Please capture a proof photo before confirming delivery.')
      return
    }
    setSubmitting(true)
    try {
      // proofUrl requires a hosted URL — send note only until upload service is available
      await apiFetch(`/v1/deliveries/${delivery.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'delivered',
          note: proofNote || 'Photo proof captured on device.',
        }),
      })
      setDelivery((d) => (d ? { ...d, status: 'delivered' } : d))
      setProofVisible(false)
      Alert.alert('Delivery confirmed ✓', 'The order has been marked as delivered.')
      setTimeout(() => router.replace('/(app)'), 1500)
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

  const destCoord = delivery.destination
    ? { latitude: delivery.destination.lat, longitude: delivery.destination.lng }
    : null
  const sourceCoord = delivery.source
    ? { latitude: delivery.source.lat, longitude: delivery.source.lng }
    : null
  const stepIdx     = STEPS.indexOf(delivery.status as typeof STEPS[number])
  const statusColor = STATUS_COLOR[delivery.status] ?? Colors.textMuted
  const orderRef    = delivery.order.claimReference ?? `#${delivery.order.id.slice(0, 8)}`
  const canCapture  = delivery.status === 'collected' || delivery.status === 'in_transit'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(app)')} style={styles.backBtn}>
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
          {/* Source marker — dealer pickup (green) */}
          {sourceCoord && (
            <Marker coordinate={sourceCoord} title="Pickup Point">
              <View style={styles.sourceMarker} />
            </Marker>
          )}

          {/* Driver marker — blue pin */}
          <Marker coordinate={driverPos} title="You (Driver)">
            <View style={styles.driverMarker} />
          </Marker>

          {/* Destination marker */}
          {destCoord && (
            <Marker coordinate={destCoord} title="Destination">
              <View style={styles.destMarker} />
            </Marker>
          )}
        </MapView>

        {locationDenied && (
          <View style={styles.locationDeniedBadge}>
            <Text style={styles.locationDeniedText}>Location access denied</Text>
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
          <Text style={styles.sectionLabel}>RECIPIENT</Text>
          <Text style={styles.infoValue}>
            {delivery.order.buyer.name ?? delivery.order.buyer.email}
          </Text>

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

        {/* Exception reporting — visible while active */}
        {['assigned', 'collected', 'in_transit'].includes(delivery.status) && (
          <TouchableOpacity
            style={styles.exceptionBtn}
            onPress={() => { setExceptionType('address_not_found'); setExceptionNote(''); setExceptionVisible(true) }}
          >
            <Text style={styles.exceptionBtnText}>⚠ Report Exception</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Current Status</Text>
            <Text style={styles.status}>{delivery.status.replace('_', ' ')}</Text>
          </View>

          {delivery.status === 'in_transit' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Mark as Delivered</Text>
              <TouchableOpacity style={styles.photoBtn} onPress={pickProofPhoto}>
                <Text style={styles.photoBtnText}>📷 Pick Proof Photo</Text>
              </TouchableOpacity>
              <Text style={styles.fieldLabel}>Proof URL / URI *</Text>
              <TextInput
                style={styles.input}
                value={proofUrl}
                onChangeText={setProofUrl}
                placeholder="https://your-photo-link.com/proof.jpg"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={styles.fieldLabel}>Note (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={note}
                onChangeText={setNote}
                placeholder="Any notes about the delivery…"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                onPress={() => setExceptionVisible(false)}
                hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.exceptionLabel}>Reason</Text>
            {[
              { key: 'address_not_found',      label: 'Address not found' },
              { key: 'recipient_unavailable',  label: 'Recipient unavailable' },
              { key: 'refused_delivery',       label: 'Refused delivery' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.exceptionOption, exceptionType === opt.key && styles.exceptionOptionActive]}
                onPress={() => setExceptionType(opt.key)}
              >
                <View style={[styles.exceptionRadio, exceptionType === opt.key && styles.exceptionRadioActive]} />
                <Text style={[styles.exceptionOptionText, exceptionType === opt.key && styles.exceptionOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.noteInput}
              placeholder="Additional details (optional)"
              placeholderTextColor={Colors.textMuted}
              value={exceptionNote}
              onChangeText={setExceptionNote}
              multiline
              numberOfLines={2}
            />

            <TouchableOpacity
              style={[styles.exceptionConfirmBtn, reportingException && styles.btnDisabled]}
              onPress={reportException}
              disabled={reportingException}
            >
              {reportingException
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.exceptionConfirmBtnText}>Submit Exception</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  sourceMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
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
    gap: 8,
  },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  orderRef: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  amount: { fontSize: 14, color: Colors.textSecondary },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  itemOem: { fontSize: 11, color: Colors.textSecondary },
  itemQty: { fontSize: 13, fontWeight: '600', color: Colors.orange500 },
  status: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, textTransform: 'capitalize' },
  fieldLabel: { fontSize: 12, color: Colors.textSecondary },
  photoBtn: {
    backgroundColor: Colors.navy800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.navy700,
    paddingVertical: 12,
    alignItems: 'center',
  },
  photoBtnText: { color: Colors.orange500, fontWeight: '600' },
  input: {
    backgroundColor: Colors.navy800,
    borderRadius: 10,
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

  // Exception
  exceptionBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  exceptionBtnText: { color: Colors.error, fontSize: 14, fontWeight: '600' },
  exceptionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  exceptionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.navy800,
    borderWidth: 1,
    borderColor: Colors.navy700,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  exceptionOptionActive: { borderColor: Colors.error, backgroundColor: 'rgba(239,68,68,0.08)' },
  exceptionRadio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.textMuted },
  exceptionRadioActive: { borderColor: Colors.error, backgroundColor: Colors.error },
  exceptionOptionText: { color: Colors.textSecondary, fontSize: 14 },
  exceptionOptionTextActive: { color: Colors.textPrimary, fontWeight: '600' },
  exceptionConfirmBtn: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  exceptionConfirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
