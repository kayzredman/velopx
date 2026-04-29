import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
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
}

const CONDITION_LABEL: Record<string, string> = { oem: 'OEM', aftermarket: 'Aftermarket', used: 'Used' }
const STOCK_COLOR: Record<string, string> = {
  in_stock: Colors.success,
  limited: Colors.warning,
  out_of_stock: Colors.error,
}
const STOCK_LABEL: Record<string, string> = { in_stock: 'In Stock', limited: 'Limited', out_of_stock: 'Out of Stock' }

export default function CatalogueScreen() {
  const { apiFetch } = useApi()
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchParts = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Part[] }>('/v1/parts?limit=100')
      setParts(res.data)
    } catch {
      setError('Failed to load parts.')
    }
  }, [apiFetch])

  useEffect(() => {
    fetchParts().finally(() => setLoading(false))
  }, [fetchParts])

  async function onRefresh() {
    setRefreshing(true)
    await fetchParts()
    setRefreshing(false)
  }

  async function handleDelete(id: string) {
    Alert.alert(
      'Remove Listing',
      'Are you sure you want to remove this part from your catalogue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/v1/parts/${id}`, { method: 'DELETE' })
              setParts((prev) => prev.filter((p) => p.id !== id))
            } catch {
              setError('Delete failed. Try again.')
            }
          },
        },
      ],
    )
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
        <Text style={styles.title}>My Catalogue</Text>
        <Text style={styles.count}>{parts.length} listing{parts.length !== 1 ? 's' : ''}</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={parts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange500} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No parts listed yet.</Text>
            <Text style={styles.emptySubtext}>Parts you add from the web dashboard will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.partName}>{item.name}</Text>
                {item.oemNumber ? <Text style={styles.oemNumber}>{item.oemNumber}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cardBottom}>
              <View style={[styles.badge, { backgroundColor: Colors.navy700 }]}>
                <Text style={styles.badgeText}>{CONDITION_LABEL[item.condition]}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: Colors.navy700 }]}>
                <Text style={[styles.badgeText, { color: STOCK_COLOR[item.stockStatus] }]}>
                  {STOCK_LABEL[item.stockStatus]}
                </Text>
              </View>
              <Text style={styles.price}>
                {item.currency} {Number(item.price).toLocaleString()}
              </Text>
            </View>
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
  errorText: { color: Colors.error, fontSize: 13, paddingHorizontal: 20, marginBottom: 8 },
  list: { padding: 20, gap: 12 },
  card: {
    backgroundColor: Colors.navy900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.navy700,
    padding: 16,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  partName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  oemNumber: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  deleteBtn: { paddingLeft: 12, paddingTop: 2 },
  deleteText: { fontSize: 12, color: Colors.error },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, color: Colors.textSecondary },
  price: { marginLeft: 'auto', fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
})
