import {useCallback, useEffect, useState, useMemo} from 'react'
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
import { ConditionBadge,
  EmptyState,
  ErrorBanner,
  useApi,
  FontFamily, useTheme, useThemedStyles, type ThemeColors} from '@velopx/shared'
import { BLANK_PART_FORM, PartFormModal, type PartFormValues } from '../../components/PartFormModal'

interface Part {
  id: string
  name: string
  description: string | null
  oemNumber: string | null
  condition: 'oem' | 'aftermarket' | 'used'
  price: string
  currency: string
  country: string
  stockStatus: 'in_stock' | 'out_of_stock' | 'limited'
}

function partToForm(part: Part): PartFormValues {
  return {
    name: part.name,
    oemNumber: part.oemNumber ?? '',
    description: part.description ?? '',
    condition: part.condition,
    price: part.price,
    currency: part.currency,
    country: part.country,
    stockStatus: part.stockStatus,
  }
}

export default function CatalogueScreen() {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { apiFetch } = useApi()
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPart, setEditingPart] = useState<Part | null>(null)

  const fetchParts = useCallback(async () => {
    setError('')
    try {
      const res = await apiFetch<{ data: Part[] }>('/v1/parts/mine?limit=100')
      setParts(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parts')
    }
  }, [apiFetch])

  useEffect(() => {
    fetchParts().finally(() => setLoading(false))
  }, [fetchParts])

  function openCreate() {
    setEditingPart(null)
    setModalVisible(true)
  }

  function openEdit(part: Part) {
    setEditingPart(part)
    setModalVisible(true)
  }

  function confirmDelete(part: Part) {
    Alert.alert('Remove listing', `Remove "${part.name}" from your catalogue?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => handleDelete(part.id),
      },
    ])
  }

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
        <ActivityIndicator color={colors.orange500} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Catalogue</Text>
          <Text style={styles.count}>{parts.length} listing(s)</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      <FlatList
        data={parts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              await fetchParts()
              setRefreshing(false)
            }}
            tintColor={colors.orange500}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No parts listed yet"
            description="Tap + Add to list your first part."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.85}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.partName}>{item.name}</Text>
                {item.oemNumber ? <Text style={styles.oemNumber}>{item.oemNumber}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => confirmDelete(item)} hitSlop={8}>
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cardBottom}>
              <ConditionBadge condition={item.condition} />
              <Text style={styles.price}>
                {item.currency} {Number(item.price).toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <PartFormModal
        visible={modalVisible}
        partId={editingPart?.id}
        initial={editingPart ? partToForm(editingPart) : BLANK_PART_FORM}
        onClose={() => setModalVisible(false)}
        onSaved={fetchParts}
      />
    </SafeAreaView>
  )
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.navy950 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: { fontFamily: FontFamily.display, fontSize: 22, fontWeight: '700', color: c.textPrimary },
  count: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
  addBtn: {
    backgroundColor: c.orange500,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: c.navy950, fontWeight: '700', fontSize: 14 },
  list: { padding: 20, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: c.navy900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.navy700,
    padding: 16,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  partName: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  oemNumber: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
  deleteText: { fontSize: 12, color: c.error },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 14, fontWeight: '700', color: c.orange500 },
})
}
