import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, useApi } from '@velopx/shared'

// ── Types ──────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string
  quantity: number
  part: { id: string; name: string }
}

interface DeliveryDetail {
  id: string
  status: string
  note: string | null
  proofUrl: string | null
  createdAt: string
  driverLocation: { lat: number; lng: number } | null
  destination: { lat: number; lng: number } | null
  estimatedMinutes: number | null
  distanceKm: number | null
  driver: { id: string; name: string | null; email: string } | null
  order: {
    id: string
    claimReference: string | null
    totalAmount: string
    currency: string
    buyer: { id: string; name: string | null; email: string }
    items: OrderItem[]
  }
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_STEPS: { key: DeliveryStatus; label: string }[] = [
  { key: 'pending',    label: 'Order Placed' },
  { key: 'assigned',   label: 'Assigned' },
  { key: 'collected',  label: 'Collected' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'confirmed',  label: 'Confirmed' },
]

const STATUS_ORDER = STATUS_STEPS.map((s) => s.key)

function getStatusIndex(status: string): number {
  return STATUS_ORDER.indexOf(status)
}

// ── Leaflet map builder ────────────────────────────────────────────────────

function buildLeafletHtml(
  driverLat: number,
  driverLng: number,
  destLat: number | null,
  destLng: number | null,
): string {
  const midLat = destLat != null ? (driverLat + destLat) / 2 : driverLat
  const midLng = destLng != null ? (driverLng + destLng) / 2 : driverLng
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0C1526; }
    #map { height: 100vh; width: 100vw; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false })
      .setView([${midLat}, ${midLng}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    var driverIcon = L.divIcon({
      html: '<div style="width:14px;height:14px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.5);"></div>',
      iconSize: [14, 14], iconAnchor: [7, 7], className: ''
    });
    var destIcon = L.divIcon({
      html: '<div style="width:18px;height:18px;border-radius:50%;background:#F5A623;border:3px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.5);"></div>',
      iconSize: [18, 18], iconAnchor: [9, 9], className: ''
    });
    L.marker([${driverLat}, ${driverLng}], { icon: driverIcon }).addTo(map).bindPopup('Driver');
    ${destLat != null && destLng != null ? `
    L.marker([${destLat}, ${destLng}], { icon: destIcon }).addTo(map).bindPopup('Destination');
    L.polyline([[${driverLat}, ${driverLng}], [${destLat}, ${destLng}]], {
      color: '#3B82F6', weight: 3, dashArray: '8, 6'
    }).addTo(map);
    map.fitBounds([[${driverLat}, ${driverLng}], [${destLat}, ${destLng}]], { padding: [40, 40] });
    ` : `map.setView([${driverLat}, ${driverLng}], 14);`}
  </script>
</body>
</html>`
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function DeliveryTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { apiFetch } = useApi()

  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchDelivery = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: DeliveryDetail }>(`/v1/deliveries/${id}`)
      setDelivery(res.data)
      setError(null)
    } catch {
      setError('Could not load delivery details.')
    } finally {
      setLoading(false)
    }
  }, [id, apiFetch])

  useEffect(() => {
    fetchDelivery()
    intervalRef.current = setInterval(fetchDelivery, 20_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchDelivery])

  function handleConfirmReceipt() {
    if (!delivery) return
    Alert.alert(
      'Confirm Receipt',
      'Confirm you have received all items in this delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setConfirming(true)
            try {
              await apiFetch<{ data: DeliveryDetail }>(`/v1/deliveries/${delivery.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'confirmed' }),
              })
              setDelivery((prev) => (prev ? { ...prev, status: 'confirmed' } : prev))
            } catch {
              Alert.alert('Error', 'Failed to confirm receipt. Please try again.')
            } finally {
              setConfirming(false)
            }
          },
        },
      ],
    )
  }

  // ── Loading / Error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.orange500} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  if (error || !delivery) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(app)')} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centeredBox}>
          <Text style={styles.errorText}>{error ?? 'Delivery not found.'}</Text>
          <TouchableOpacity onPress={fetchDelivery} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Use live driver GPS; fallback to Accra, Ghana
  const driverLat = delivery.driverLocation?.lat ?? delivery.destination?.lat ?? 5.6037
  const driverLng = delivery.driverLocation?.lng ?? delivery.destination?.lng ?? -0.187
  const hasMapData = delivery.driverLocation != null || delivery.destination != null
  const currentIndex = getStatusIndex(delivery.status)

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(app)')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Track Delivery</Text>
          {delivery.order.claimReference ? (
            <Text style={styles.headerSub}>{delivery.order.claimReference}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View style={styles.mapContainer}>
          {hasMapData ? (
            <WebView
              source={{
                html: buildLeafletHtml(
                  driverLat,
                  driverLng,
                  delivery.destination?.lat ?? null,
                  delivery.destination?.lng ?? null,
                ),
              }}
              style={styles.map}
              scrollEnabled={false}
              javaScriptEnabled
              originWhitelist={['*']}
            />
          ) : (
            <View style={[styles.map, styles.mapPlaceholder]}>
              <Text style={styles.mapPlaceholderText}>Awaiting GPS signal…</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* ETA Card */}
          <View style={styles.etaCard}>
            <View style={styles.etaStat}>
              <Text style={styles.etaValue}>
                {delivery.estimatedMinutes != null ? `~${delivery.estimatedMinutes} mins` : '—'}
              </Text>
              <Text style={styles.etaLabel}>Est. Arrival</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaStat}>
              <Text style={styles.etaValue}>
                {delivery.distanceKm != null ? `${delivery.distanceKm} km` : '—'}
              </Text>
              <Text style={styles.etaLabel}>Distance</Text>
            </View>
          </View>

          {/* Driver Info */}
          {delivery.driver ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Driver</Text>
              <View style={styles.infoCard}>
                <Text style={styles.driverName}>
                  {delivery.driver.name ?? delivery.driver.email}
                </Text>
                {delivery.driver.name ? (
                  <Text style={styles.infoDetail}>{delivery.driver.email}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Status Timeline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            {STATUS_STEPS.map((step, index) => {
              const isPast = index < currentIndex
              const isCurrent = index === currentIndex
              const isFuture = index > currentIndex
              return (
                <View key={step.key} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.dot,
                        isPast && styles.dotPast,
                        isCurrent && styles.dotCurrent,
                        isFuture && styles.dotFuture,
                      ]}
                    />
                    {index < STATUS_STEPS.length - 1 ? (
                      <View
                        style={[styles.line, isPast ? styles.linePast : styles.lineFuture]}
                      />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.timelineLabel,
                      isCurrent && styles.labelCurrent,
                      isFuture && styles.labelFuture,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              )
            })}
          </View>

          {/* Confirm Receipt */}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (delivery.status !== 'delivered' || confirming) && styles.btnDisabled,
            ]}
            disabled={delivery.status !== 'delivered' || confirming}
            onPress={handleConfirmReceipt}
          >
            <Text style={styles.confirmText}>
              {confirming ? 'Confirming…' : 'Confirm Receipt'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy950 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { paddingRight: 4 },
  backText: { color: Colors.orange500, fontSize: 15 },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  mapContainer: { height: 260, backgroundColor: Colors.navy900 },
  map: { flex: 1, backgroundColor: Colors.navy900 },
  mapPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  mapPlaceholderText: { color: Colors.textSecondary, fontSize: 13 },
  body: { padding: 20, gap: 16 },
  etaCard: {
    backgroundColor: Colors.navy900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.navy700,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  etaStat: { flex: 1, alignItems: 'center' },
  etaValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  etaLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  etaDivider: { width: 1, height: 40, backgroundColor: Colors.navy700 },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoCard: {
    backgroundColor: Colors.navy900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.navy700,
    padding: 14,
    gap: 4,
  },
  driverName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  infoDetail: { fontSize: 13, color: Colors.textSecondary },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 36 },
  timelineLeft: { width: 28, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  dotPast: { backgroundColor: Colors.success },
  dotCurrent: { backgroundColor: Colors.orange500 },
  dotFuture: { backgroundColor: Colors.navy700, borderWidth: 1, borderColor: Colors.navy600 },
  line: { width: 2, flex: 1, marginTop: 2 },
  linePast: { backgroundColor: Colors.success },
  lineFuture: { backgroundColor: Colors.navy700 },
  timelineLabel: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20, paddingTop: 1 },
  labelCurrent: { color: Colors.orange500, fontWeight: '600' },
  labelFuture: { color: Colors.textSecondary },
  confirmBtn: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.4 },
  confirmText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  centeredBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: Colors.error, fontSize: 14 },
  retryBtn: {
    backgroundColor: Colors.navy800,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.navy700,
  },
  retryText: { color: Colors.textPrimary, fontSize: 14 },
})
