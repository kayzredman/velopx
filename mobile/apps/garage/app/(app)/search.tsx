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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.searchBox}>
          <Text style={styles.title}>Parts Search</Text>

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
                <View style={[styles.stockDot, { backgroundColor: STOCK_COLOR[item.stockStatus] }]}>
                  <Text style={styles.stockText}>
                    {item.stockStatus === 'in_stock' ? 'In Stock' : item.stockStatus === 'limited' ? 'Limited' : 'Out of Stock'}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
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
})
