import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, ConditionBadge, EmptyState, ErrorBanner, useApi, FontFamily } from '@velopx/shared'

interface Part {
  id: string
  name: string
  description: string | null
  oemNumber: string | null
  condition: 'oem' | 'aftermarket' | 'used'
  price: string
  currency: string
  stockStatus: string
}

export default function CatalogueScreen() {
  const { apiFetch } = useApi()
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchParts = useCallback(async () => {
    setError('')
    try {
      const res = await apiFetch<{ data: Part[] }>('/v1/parts/mine?limit=100')
      setParts(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parts')
    }
  }, [apiFetch])

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setForm(initial ?? BLANK_FORM)
      setFormError('')
    }
  }, [visible, initial])

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/v1/parts/${id}`, { method: 'DELETE' })
      setParts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
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
        <Text style={styles.title}>My Catalogue</Text>
        <Text style={styles.count}>{parts.length} listing(s)</Text>
      </View>
      {error ? <ErrorBanner message={error} /> : null}
      <FlatList
        data={parts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchParts(); setRefreshing(false) }} tintColor={Colors.orange500} />}
        ListEmptyComponent={<EmptyState title="No parts listed yet" description="Add parts from the web dashboard or mobile web." />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.partName}>{item.name}</Text>
                {item.oemNumber ? <Text style={styles.oemNumber}>{item.oemNumber}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cardBottom}>
              <ConditionBadge condition={item.condition} />
              <Text style={styles.price}>{item.currency} {Number(item.price).toLocaleString()}</Text>
            </View>
          </View>
        )}
      />

      <PartFormModal
        visible={modalVisible}
        initial={
          editingPart
            ? {
                name: editingPart.name,
                description: editingPart.description ?? '',
                oemNumber: editingPart.oemNumber ?? '',
                condition: editingPart.condition,
                price: editingPart.price,
                currency: editingPart.currency,
                country: editingPart.country,
                stockStatus: editingPart.stockStatus,
              }
            : null
        }
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy950 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontFamily: FontFamily.display, fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  count: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  list: { padding: 20, gap: 12 },
  card: { backgroundColor: Colors.navy900, borderRadius: 14, borderWidth: 1, borderColor: Colors.navy700, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  partName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  oemNumber: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  deleteText: { fontSize: 12, color: Colors.error },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 14, fontWeight: '700', color: Colors.orange500 },
})
