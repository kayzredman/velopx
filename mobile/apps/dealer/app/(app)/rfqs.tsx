import {useCallback, useEffect, useState, useMemo} from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState, ErrorBanner, useApi, FontFamily, useTheme, useThemedStyles, type ThemeColors} from '@velopx/shared'

interface QuoteItem {
  id: string
  price: string
  currency: string
  part: { name: string; dealerId?: string }
}

interface Quote {
  id: string
  status: string
  claimReference: string | null
  requester?: { name: string | null }
  items: QuoteItem[]
}

export default function RfqsScreen() {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { apiFetch } = useApi()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)

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

  async function respond(quote: Quote) {
    setActingId(quote.id)
    try {
      await apiFetch(`/v1/quotes/${quote.id}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({
          items: quote.items.map((item) => ({
            quoteItemId: item.id,
            price: Number(item.price),
            currency: item.currency,
          })),
        }),
      })
      await fetchQuotes()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to respond')
    } finally {
      setActingId(null)
    }
  }

  async function decline(quote: Quote) {
    Alert.alert('Decline RFQ', 'Decline this quote request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          setActingId(quote.id)
          try {
            await apiFetch(`/v1/quotes/${quote.id}/dealer-decline`, { method: 'PATCH' })
            await fetchQuotes()
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to decline')
          } finally {
            setActingId(null)
          }
        },
      },
    ])
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
        <Text style={styles.title}>RFQ Inbox</Text>
      </View>
      {error ? <ErrorBanner message={error} /> : null}
      <FlatList
        data={quotes}
        keyExtractor={(q) => q.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No RFQs" description="Quote requests from garages will appear here." />}
        renderItem={({ item }) => {
          const busy = actingId === item.id
          return (
            <View style={styles.card}>
              <Text style={styles.name}>{item.requester?.name ?? 'Garage'}</Text>
              <Text style={styles.meta}>
                {item.claimReference ?? 'No claim ref'} · {item.status}
              </Text>
              {item.items.map((i) => (
                <Text key={i.id} style={styles.item}>
                  {i.part.name} — {i.currency} {Number(i.price).toLocaleString()}
                </Text>
              ))}
              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, busy && styles.btnDisabled]}
                    onPress={() => respond(item)}
                    disabled={busy}
                  >
                    {busy ? (
                      <ActivityIndicator color={colors.navy950} size="small" />
                    ) : (
                      <Text style={styles.primaryText}>Respond</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.outlineBtn, busy && styles.btnDisabled]}
                    onPress={() => decline(item)}
                    disabled={busy}
                  >
                    <Text style={styles.outlineText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.navy950 },
  header: { padding: 20 },
  title: { fontFamily: FontFamily.display, fontSize: 22, fontWeight: '700', color: c.textPrimary },
  list: { padding: 20, gap: 12 },
  card: {
    backgroundColor: c.navy900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.navy700,
    padding: 16,
    gap: 8,
  },
  name: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  meta: { fontSize: 12, color: c.textSecondary },
  item: { fontSize: 13, color: c.textSecondary },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  primaryBtn: {
    flex: 1,
    backgroundColor: c.orange500,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryText: { color: c.navy950, fontWeight: '700' },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.navy700,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  outlineText: { color: c.textSecondary },
  btnDisabled: { opacity: 0.5 },
})
}
