import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, useApi } from '@velopx/shared'

interface Part {
  id: string
  name: string
  oemNumber: string | null
  condition: 'oem' | 'aftermarket' | 'used'
  price: string
  currency: string
  stockStatus: 'in_stock' | 'out_of_stock' | 'limited'
  country: string
  dealer: { id: string; name: string | null }
}

interface VinResult {
  vin: string
  make: string | null
  model: string | null
  year: number | null
  bodyClass: string | null
  engineDisplacementL: string | null
  fuelType: string | null
  driveType: string | null
  vehicleType: string | null
}

const CONDITION_LABEL: Record<string, string> = { oem: 'OEM', aftermarket: 'Aftermarket', used: 'Used' }
const STOCK_COLOR: Record<string, string> = {
  in_stock: Colors.success,
  limited: Colors.warning,
  out_of_stock: Colors.error,
}

export default function SearchScreen() {
  const { apiFetch } = useApi()
  const [query, setQuery] = useState('')
  const [condition, setCondition] = useState<string>('')
  const [results, setResults] = useState<Part[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [quoteModal, setQuoteModal] = useState<Part | null>(null)
  const [quoteNote, setQuoteNote] = useState('')
  const [submittingQuote, setSubmittingQuote] = useState(false)

  // VIN decode state
  const [vinInput, setVinInput] = useState('')
  const [vinResult, setVinResult] = useState<VinResult | null>(null)
  const [vinLoading, setVinLoading] = useState(false)
  const [vinError, setVinError] = useState('')
  const [vinExpanded, setVinExpanded] = useState(false)

  const lookupVin = useCallback(async () => {
    const vin = vinInput.trim().toUpperCase()
    if (vin.length !== 17) {
      setVinError('VIN must be exactly 17 characters')
      return
    }
    setVinLoading(true)
    setVinError('')
    setVinResult(null)
    try {
      const res = await apiFetch<{ data: VinResult }>(`/v1/vehicles/decode?vin=${vin}`)
      setVinResult(res.data)
      // Auto-populate search with make + model
      if (res.data.make && res.data.model) {
        setQuery(`${res.data.make} ${res.data.model}`)
      } else if (res.data.make) {
        setQuery(res.data.make)
      }
    } catch {
      setVinError('Could not decode VIN. Check the number and try again.')
    } finally {
      setVinLoading(false)
    }
  }, [vinInput, apiFetch])

  const doSearch = useCallback(async () => {
    if (!query.trim() && !condition) return
    setLoading(true)
    setSearched(true)

    try {
      const params = new URLSearchParams({ limit: '50' })
      if (query.trim()) params.set('q', query.trim())
      if (condition) params.set('condition', condition)

      const res = await apiFetch<{ data: Part[] }>(`/v1/parts?${params.toString()}`)
      setResults(res.data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, condition, apiFetch])

  const CONDITIONS = ['', 'oem', 'aftermarket', 'used']
  const CONDITION_FILTER_LABELS: Record<string, string> = { '': 'All', oem: 'OEM', aftermarket: 'Aftermarket', used: 'Used' }

  async function handleRequestQuote() {
    if (!quoteModal) return
    setSubmittingQuote(true)
    try {
      await apiFetch('/v1/quotes', {
        method: 'POST',
        body: JSON.stringify({
          items: [{
            partId: quoteModal.id,
            price: Number(quoteModal.price),
            currency: quoteModal.currency,
            note: quoteNote.trim() || undefined,
          }],
        }),
      })
      setQuoteModal(null)
      setQuoteNote('')
      Alert.alert('Quote Requested', 'Your quote request has been sent to the dealer.')
    } catch {
      Alert.alert('Error', 'Failed to submit quote request. Please try again.')
    } finally {
      setSubmittingQuote(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.searchBox}>
          <Text style={styles.title}>Parts Search</Text>

          {/* ── VIN Lookup ── */}
          <TouchableOpacity
            style={styles.vinToggle}
            onPress={() => { setVinExpanded((v) => !v); setVinError(''); setVinResult(null) }}
          >
            <Text style={styles.vinToggleText}>🔍 Lookup by VIN</Text>
            <Text style={styles.vinToggleChevron}>{vinExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {vinExpanded && (
            <View style={styles.vinBox}>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={vinInput}
                  onChangeText={(v) => { setVinInput(v.toUpperCase()); setVinError('') }}
                  placeholder="Enter 17-character VIN"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                  maxLength={17}
                  returnKeyType="search"
                  onSubmitEditing={lookupVin}
                />
                <TouchableOpacity
                  style={[styles.searchBtn, vinLoading && styles.btnDisabled]}
                  onPress={lookupVin}
                  disabled={vinLoading || vinInput.trim().length !== 17}
                >
                  {vinLoading
                    ? <ActivityIndicator color={Colors.navy950} size="small" />
                    : <Text style={styles.searchBtnText}>Decode</Text>
                  }
                </TouchableOpacity>
              </View>
              {vinError ? <Text style={styles.vinError}>{vinError}</Text> : null}
              {vinResult && (
                <View style={styles.vinCard}>
                  <Text style={styles.vinCarTitle}>
                    {[vinResult.year, vinResult.make, vinResult.model].filter(Boolean).join(' ')}
                  </Text>
                  {vinResult.bodyClass ? <Text style={styles.vinDetail}>Body: {vinResult.bodyClass}</Text> : null}
                  {vinResult.engineDisplacementL ? <Text style={styles.vinDetail}>Engine: {vinResult.engineDisplacementL}L</Text> : null}
                  {vinResult.fuelType ? <Text style={styles.vinDetail}>Fuel: {vinResult.fuelType}</Text> : null}
                  {vinResult.driveType ? <Text style={styles.vinDetail}>Drive: {vinResult.driveType}</Text> : null}
                  <Text style={styles.vinHint}>Search pre-filled ↓ tap Search to find compatible parts</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Part name or OEM number"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="search"
              onSubmitEditing={doSearch}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={doSearch} disabled={loading}>
              <Text style={styles.searchBtnText}>Search</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.filterChip, condition === c && styles.filterChipActive]}
                onPress={() => setCondition(c)}
              >
                <Text style={[styles.filterChipText, condition === c && styles.filterChipTextActive]}>
                  {CONDITION_FILTER_LABELS[c]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.orange500} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              searched ? (
                <Text style={styles.emptyText}>No parts found. Try a different search.</Text>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.partName}>{item.name}</Text>
                    {item.oemNumber ? <Text style={styles.oemNumber}>{item.oemNumber}</Text> : null}
                    <Text style={styles.dealerName}>{item.dealer.name ?? 'Unknown dealer'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={styles.price}>
                      {item.currency} {Number(item.price).toLocaleString()}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: Colors.navy700 }]}>
                      <Text style={styles.badgeText}>{CONDITION_LABEL[item.condition]}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <View style={[styles.stockDot, { backgroundColor: STOCK_COLOR[item.stockStatus] }]}>
                    <Text style={styles.stockText}>
                      {item.stockStatus === 'in_stock' ? 'In Stock' : item.stockStatus === 'limited' ? 'Limited' : 'Out of Stock'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.rfqBtn}
                    onPress={() => { setQuoteModal(item); setQuoteNote('') }}
                  >
                    <Text style={styles.rfqBtnText}>Request Quote</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>

      {/* Request Quote Modal */}
      <Modal
        visible={!!quoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setQuoteModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Request Quote</Text>
            {quoteModal && (
              <>
                <View style={styles.modalPartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalPartName}>{quoteModal.name}</Text>
                    <Text style={styles.modalDealerName}>{quoteModal.dealer.name ?? 'Unknown dealer'}</Text>
                  </View>
                  <Text style={styles.modalPrice}>
                    {quoteModal.currency} {Number(quoteModal.price).toLocaleString()}
                  </Text>
                </View>

                <TextInput
                  style={styles.modalNoteInput}
                  value={quoteNote}
                  onChangeText={setQuoteNote}
                  placeholder="Add a note (vehicle details, urgency, etc.)"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setQuoteModal(null)}
                    disabled={submittingQuote}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitBtn, submittingQuote && styles.btnDisabled]}
                    onPress={handleRequestQuote}
                    disabled={submittingQuote}
                  >
                    {submittingQuote
                      ? <ActivityIndicator color={Colors.navy950} size="small" />
                      : <Text style={styles.submitBtnText}>Send Request</Text>
                    }
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy950 },
  searchBox: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: Colors.navy800,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.navy700,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: Colors.orange500,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: { color: Colors.navy950, fontWeight: '700', fontSize: 13 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.navy800,
    borderWidth: 1,
    borderColor: Colors.navy700,
  },
  filterChipActive: { backgroundColor: Colors.orange500, borderColor: Colors.orange500 },
  filterChipText: { fontSize: 12, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.navy950, fontWeight: '600' },
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
  partName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  oemNumber: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  dealerName: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  price: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, color: Colors.textSecondary },
  stockDot: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stockText: { fontSize: 11, color: Colors.white, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 40, fontSize: 14 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rfqBtn: {
    borderWidth: 1,
    borderColor: Colors.orange500,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  rfqBtnText: { fontSize: 12, fontWeight: '600', color: Colors.orange500 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.navy900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalPartRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modalPartName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  modalDealerName: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  modalPrice: { fontSize: 15, fontWeight: '700', color: Colors.orange500 },
  modalNoteInput: {
    backgroundColor: Colors.navy800,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.navy700,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    minHeight: 80,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.navy700,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  submitBtn: {
    flex: 2,
    backgroundColor: Colors.orange500,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitBtnText: { color: Colors.navy950, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  // VIN lookup
  vinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.navy800,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.navy700,
  },
  vinToggleText: { fontSize: 13, color: Colors.orange500, fontWeight: '600' },
  vinToggleChevron: { fontSize: 11, color: Colors.textMuted },
  vinBox: { gap: 8 },
  vinError: { fontSize: 12, color: Colors.error },
  vinCard: {
    backgroundColor: Colors.navy800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.navy700,
    padding: 12,
    gap: 4,
  },
  vinCarTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  vinDetail: { fontSize: 12, color: Colors.textSecondary },
  vinHint: { fontSize: 11, color: Colors.orange500, marginTop: 4 },
})
