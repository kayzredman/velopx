import { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, useApi, useLoadMore } from '@velopx/shared'

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
}

const STATUS_COLOR: Record<string, string> = {
  pending:   Colors.warning,
  responded: Colors.info,
  accepted:  Colors.success,
  declined:  Colors.error,
  expired:   Colors.textMuted,
}

export default function QuotesScreen() {
  const { apiFetch } = useApi()
  const { items: quotes, loading, loadingMore, refreshing, hasMore, total,
          query, setQuery, onRefresh, onLoadMore, updateItem } = useLoadMore<Quote>({
    buildPath: (page, q) => {
      const params = new URLSearchParams({ limit: '20', page: String(page) })
      if (q.trim()) params.set('q', q.trim())
      return `/v1/quotes?${params}`
    },
  })
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function handleStatusChange(id: string, status: 'accepted' | 'declined') {
    setUpdatingId(id)
    try {
      await apiFetch(`/v1/quotes/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      updateItem(id, { status })
    } finally {
      setUpdatingId(null)
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
        <Text style={styles.title}>Quotes</Text>
        <Text style={styles.count}>{total} quote{total !== 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by claim reference…"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={quotes}
        keyExtractor={(q) => q.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange500} />}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No quotes yet.</Text>
            <Text style={styles.emptySubtext}>Request quotes from dealers via parts search.</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={Colors.orange500} style={{ paddingVertical: 16 }} />
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
                <Text style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
                {item.claimReference ? (
                  <Text style={styles.claimRef}>{item.claimReference}</Text>
                ) : null}
              </View>
              <View style={[styles.statusBadge, { borderColor: STATUS_COLOR[item.status] }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
                  {item.status}
                </Text>
              </View>
            </View>

            {item.items.map((qi) => (
              <View key={qi.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{qi.part.name}</Text>
                <Text style={styles.itemPrice}>
                  {qi.currency} {Number(qi.price).toLocaleString()}
                </Text>
              </View>
            ))}

            {item.status === 'responded' && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.declineBtn, updatingId === item.id && styles.btnDisabled]}
                  onPress={() => handleStatusChange(item.id, 'declined')}
                  disabled={updatingId === item.id}
                >
                  <Text style={[styles.actionBtnText, { color: Colors.error }]}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn, updatingId === item.id && styles.btnDisabled]}
                  onPress={() => handleStatusChange(item.id, 'accepted')}
                  disabled={updatingId === item.id}
                >
                  <Text style={[styles.actionBtnText, { color: Colors.navy950 }]}>
                    {updatingId === item.id ? 'Updating…' : 'Accept'}
                  </Text>
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
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  count: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
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
  date: { fontSize: 12, color: Colors.textSecondary },
  claimRef: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 13, color: Colors.textPrimary, flex: 1 },
  itemPrice: { fontSize: 13, fontWeight: '600', color: Colors.orange500 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  acceptBtn: { backgroundColor: Colors.orange500 },
  declineBtn: { backgroundColor: Colors.navy700 },
  btnDisabled: { opacity: 0.5 },
  actionBtnText: { fontWeight: '600', fontSize: 13 },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  emptySubtext: { color: Colors.textMuted, fontSize: 12, marginTop: 6 },
  searchRow: { paddingHorizontal: 20, paddingBottom: 12 },
  searchInput: { backgroundColor: Colors.navy900, borderWidth: 1, borderColor: Colors.navy700, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: Colors.textPrimary },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, color: Colors.orange500, fontWeight: '600' },
})
