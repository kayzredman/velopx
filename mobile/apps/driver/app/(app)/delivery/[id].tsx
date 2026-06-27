import * as ImagePicker from 'expo-image-picker'
import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, useApi } from '@velopx/shared'
import { useLocalSearchParams, useRouter } from 'expo-router'

interface OrderItem {
  id: string
  quantity: number
  price: string
  part: { id: string; name: string; oemNumber: string | null }
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

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { apiFetch } = useApi()
  const router = useRouter()

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [proofUrl, setProofUrl] = useState('')
  const [note, setNote] = useState('')

  const fetchDelivery = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Delivery }>(`/v1/deliveries/${id}`)
      setDelivery(res.data)
    } catch {
      Alert.alert('Error', 'Failed to load delivery details.')
      router.back()
    }
  }, [id, apiFetch, router])

  useEffect(() => {
    fetchDelivery().finally(() => setLoading(false))
  }, [fetchDelivery])

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

    setSubmitting(true)
    try {
      await apiFetch(`/v1/deliveries/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'delivered',
          proofUrl: proofUrl.trim(),
          note: note.trim() || undefined,
        }),
      })
      Alert.alert('Success', 'Delivery marked as delivered.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update delivery.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !delivery) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.orange500} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  const { order } = delivery

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Delivery Detail</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Order</Text>
            <Text style={styles.orderRef}>
              {order.claimReference ?? `#${order.id.slice(0, 8)}`}
            </Text>
            <Text style={styles.amount}>
              {order.currency} {Number(order.totalAmount).toLocaleString()}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Items</Text>
            {order.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.part.name}</Text>
                {item.part.oemNumber ? (
                  <Text style={styles.itemOem}>{item.part.oemNumber}</Text>
                ) : null}
                <Text style={styles.itemQty}>×{item.quantity}</Text>
              </View>
            ))}
          </View>

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
                style={[styles.deliverBtn, submitting && styles.btnDisabled]}
                onPress={handleMarkDelivered}
                disabled={submitting}
              >
                <Text style={styles.deliverBtnText}>
                  {submitting ? 'Submitting…' : 'Confirm Delivery'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {delivery.proofUrl && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Proof of Delivery</Text>
              <Text style={styles.proofUrl}>{delivery.proofUrl}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy950 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 4 },
  backText: { color: Colors.orange500, fontSize: 14 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  section: {
    backgroundColor: Colors.navy900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.navy700,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  deliverBtn: {
    backgroundColor: Colors.orange500,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  deliverBtnText: { color: Colors.navy950, fontWeight: '700', fontSize: 15 },
  proofUrl: { fontSize: 12, color: Colors.info },
})
