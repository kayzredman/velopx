import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, EmptyState, ErrorBanner, useApi, FontFamily } from '@velopx/shared'

interface Quote {
  id: string
  status: string
  claimReference: string | null
  requester?: { name: string | null }
  items: Array<{ part: { name: string }; price: string; currency: string }>
}

export default function RfqsScreen() {
  const { apiFetch } = useApi()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchQuotes = useCallback(async () => {
    setError('')
    try {
      const res = await apiFetch<{ data: Quote[] }>('/v1/quotes/for-dealer')
      setQuotes(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RFQs')
    }
  }, [apiFetch])

  useEffect(() => {
    fetchQuotes().finally(() => setLoading(false))
  }, [fetchQuotes])

  async function respond(id: string, status: 'responded' | 'declined') {
    await apiFetch(`/v1/quotes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    fetchQuotes()
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
        <Text style={styles.title}>RFQ Inbox</Text>
      </View>
      {error ? <ErrorBanner message={error} /> : null}
      <FlatList
        data={quotes}
        keyExtractor={(q) => q.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No RFQs" description="Quote requests from garages will appear here." />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.requester?.name ?? 'Garage'}</Text>
            <Text style={styles.meta}>{item.claimReference ?? 'No claim ref'} · {item.status}</Text>
            {item.items.map((i, idx) => (
              <Text key={idx} style={styles.item}>{i.part.name} — {i.currency} {Number(i.price).toLocaleString()}</Text>
            ))}
            {item.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => respond(item.id, 'responded')}>
                  <Text style={styles.primaryText}>Respond</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => respond(item.id, 'declined')}>
                  <Text style={styles.outlineText}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy950 },
  header: { padding: 20 },
  title: { fontFamily: FontFamily.display, fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  list: { padding: 20, gap: 12 },
  card: { backgroundColor: Colors.navy900, borderRadius: 14, borderWidth: 1, borderColor: Colors.navy700, padding: 16, gap: 8 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  meta: { fontSize: 12, color: Colors.textSecondary },
  item: { fontSize: 13, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  primaryBtn: { flex: 1, backgroundColor: Colors.orange500, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  primaryText: { color: Colors.navy950, fontWeight: '700' },
  outlineBtn: { flex: 1, borderWidth: 1, borderColor: Colors.navy700, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  outlineText: { color: Colors.textSecondary },
})
