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
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, useApi } from '@velopx/shared'

interface QuoteItem {
  id: string
  price: string
  currency: string
  note: string | null
  part: { id: string; name: string; oemNumber: string | null }
}

interface Quote {
  id: string
  status: 'pending' | 'responded' | 'accepted' | 'declined' | 'expired'
  claimReference: string | null
  createdAt: string
  items: QuoteItem[]
  requester: { id: string; name: string | null; email: string }
}

interface RespondItem {
  quoteItemId: string
  partName: string
  price: string
  currency: string
  note: string
}

const STATUS_COLOR: Record<string, string> = {
  pending:   Colors.warning,
  responded: Colors.info,
  accepted:  Colors.success,
  declined:  Colors.error,
  expired:   Colors.textMuted,
}

export default function DealerRFQsScreen() {
  const { apiFetch } = useApi()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [respondModal, setRespondModal] = useState<Quote | null>(null)
  const [formItems, setFormItems] = useState<RespondItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Quote[] }>('/v1/quotes/for-dealer')
      setQuotes(res.data)
    } catch { /* keep */ }
  }, [apiFetch])

  useEffect(() => {
    fetchQuotes().finally(() => setLoading(false))
  }, [fetchQuotes])

  async function onRefresh() {
    setRefreshing(true)
    await fetchQuotes()
    setRefreshing(false)
  }

  function openRespond(q: Quote) {
    setRespondModal(q)
    setFormItems(
      q.items.map((item) => ({
        quoteItemId: item.id,
        partName: item.part.name,
        price: item.price,
        currency: item.currency,
        note: '',
      })),
    )
  }

  async function handleRespond() {
    if (!respondModal) return
    setSubmitting(true)
    try {
      await apiFetch(`/v1/quotes/${respondModal.id}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({
          items: formItems.map((i) => ({
            quoteItemId: i.quoteItemId,
            price: Number(i.price),
            currency: i.currency,
            note: i.note.trim() || undefined,
          })),
        }),
      })
      setRespondModal(null)
      await fetchQuotes()
    } finally {
      setSubmitting(false)
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
        <Text style={styles.title}>RFQs</Text>
        <Text style={styles.subtitle}>
          {quotes.filter((q) => q.status === 'pending').length} pending
        </Text>
      </View>

      <FlatList
        data={quotes}
        keyExtractor={(q) => q.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange500} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No RFQs yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.requester}>
                  {item.requester.name ?? item.requester.email}
                </Text>
                {item.claimReference && (
                  <Text style={styles.meta}>{item.claimReference}</Text>
                )}
                <Text style={styles.meta}>
                  {new Date(item.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={[styles.statusBadge, { borderColor: STATUS_COLOR[item.status] ?? Colors.navy700 }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] ?? Colors.textSecondary }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.partsList}>
              {item.items.map((i) => i.part.name).join('  ·  ')}
            </Text>

            {item.status === 'pending' && (
              <TouchableOpacity style={styles.respondBtn} onPress={() => openRespond(item)}>
                <Text style={styles.respondText}>Respond →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Respond Modal */}
      <Modal
        visible={!!respondModal}
        transparent
        animationType="slide"
        onRequestClose={() => setRespondModal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Respond to RFQ</Text>
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {formItems.map((fi, idx) => (
                  <View key={fi.quoteItemId} style={styles.formItem}>
                    <Text style={styles.formItemName}>{fi.partName}</Text>
                    <Text style={styles.formLabel}>Price ({fi.currency})</Text>
                    <TextInput
                      style={styles.formInput}
                      value={fi.price}
                      onChangeText={(v) => {
                        const updated = [...formItems]
                        updated[idx] = { ...fi, price: v }
                        setFormItems(updated)
                      }}
                      keyboardType="decimal-pad"
                      placeholderTextColor={Colors.textMuted}
                    />
                    <Text style={styles.formLabel}>Note (optional)</Text>
                    <TextInput
                      style={[styles.formInput, { marginBottom: 0 }]}
                      value={fi.note}
                      onChangeText={(v) => {
                        const updated = [...formItems]
                        updated[idx] = { ...fi, note: v }
                        setFormItems(updated)
                      }}
                      placeholder="Add note…"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setRespondModal(null)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleRespond}
                  disabled={submitting}
                >
                  <Text style={styles.submitText}>{submitting ? 'Sending…' : 'Send Response'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy950 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  list: { padding: 20, gap: 12 },
  card: {
    backgroundColor: Colors.navy900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.navy700,
    padding: 16,
    gap: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  requester: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  meta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  partsList: { fontSize: 12, color: Colors.textSecondary },
  respondBtn: {
    backgroundColor: Colors.orange500,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 4,
  },
  respondText: { color: Colors.navy950, fontWeight: '700', fontSize: 13 },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: Colors.navy900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  formItem: {
    backgroundColor: Colors.navy950,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  formItemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  formLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: Colors.navy900,
    borderWidth: 1,
    borderColor: Colors.navy700,
    borderRadius: 8,
    padding: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    marginBottom: 6,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.navy700,
    alignItems: 'center',
  },
  cancelText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },
  submitBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.orange500,
    alignItems: 'center',
  },
  submitText: { color: Colors.navy950, fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
})
