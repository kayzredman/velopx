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
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, useApi, useLoadMore } from '@velopx/shared'

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

interface PartForm {
  name: string
  description: string
  oemNumber: string
  condition: 'oem' | 'aftermarket' | 'used'
  price: string
  currency: string
  country: string
  stockStatus: 'in_stock' | 'out_of_stock' | 'limited'
  images: string[]
}

const BLANK_FORM: PartForm = {
  name: '',
  description: '',
  oemNumber: '',
  condition: 'oem',
  price: '',
  currency: 'GHS',
  country: 'GH',
  stockStatus: 'in_stock',
  images: [],
}

const CONDITION_LABEL: Record<string, string> = { oem: 'OEM', aftermarket: 'Aftermarket', used: 'Used' }
const STOCK_COLOR: Record<string, string> = {
  in_stock: Colors.success,
  limited: Colors.warning,
  out_of_stock: Colors.error,
}
const STOCK_LABEL: Record<string, string> = { in_stock: 'In Stock', limited: 'Limited', out_of_stock: 'Out of Stock' }

// ── Part Form Modal ────────────────────────────────────────────────────────────

function PartFormModal({
  visible,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean
  initial: PartForm | null
  onClose: () => void
  onSave: (form: PartForm) => Promise<void>
}) {
  const isEdit = initial !== null
  const [form, setForm] = useState<PartForm>(initial ?? BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setForm(initial ?? BLANK_FORM)
      setFormError('')
    }
  }, [visible, initial])

  function set(key: keyof PartForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError('Name is required.'); return }
    const priceNum = parseFloat(form.price)
    if (isNaN(priceNum) || priceNum <= 0) { setFormError('Enter a valid price greater than 0.'); return }
    setSaving(true)
    setFormError('')
    try {
      await onSave(form)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Save failed. Please try again.'
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  function SegmentControl<T extends string>({
    options,
    value,
    onChange,
    labels,
  }: {
    options: T[]
    value: T
    onChange: (v: T) => void
    labels: Record<T, string>
  }) {
    return (
      <View style={styles.segment}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.segmentItem, value === opt && styles.segmentActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.segmentText, value === opt && styles.segmentTextActive]}>
              {labels[opt]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{isEdit ? 'Edit Part' : 'Add Part'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.modalSave}>
              <Text style={[styles.modalSaveText, saving && { opacity: 0.5 }]}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <Text style={styles.fieldLabel}>Part Name *</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.name}
              onChangeText={(v) => set('name', v)}
              placeholder="e.g. Front Brake Pad Set"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>OEM Number</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.oemNumber}
              onChangeText={(v) => set('oemNumber', v)}
              placeholder="e.g. 45022-SDA-A00"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="characters"
            />

            <Text style={styles.fieldLabel}>Condition</Text>
            <SegmentControl
              options={['oem', 'aftermarket', 'used'] as const}
              value={form.condition}
              onChange={(v) => set('condition', v)}
              labels={{ oem: 'OEM', aftermarket: 'Aftermarket', used: 'Used' }}
            />

            <Text style={styles.fieldLabel}>Stock Status</Text>
            <SegmentControl
              options={['in_stock', 'limited', 'out_of_stock'] as const}
              value={form.stockStatus}
              onChange={(v) => set('stockStatus', v)}
              labels={{ in_stock: 'In Stock', limited: 'Limited', out_of_stock: 'Out of Stock' }}
            />

            <View style={styles.priceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Price *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.price}
                  onChangeText={(v) => set('price', v)}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.currencyBox}>
                <Text style={styles.fieldLabel}>Currency</Text>
                <SegmentControl
                  options={['GHS', 'USD'] as const}
                  value={form.currency as 'GHS' | 'USD'}
                  onChange={(v) => set('currency', v)}
                  labels={{ GHS: 'GHS', USD: 'USD' }}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextarea]}
              value={form.description}
              onChangeText={(v) => set('description', v)}
              placeholder="Optional — vehicle compatibility, notes…"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Images (URLs)</Text>
            <Text style={[styles.fieldLabel, { fontSize: 11, fontWeight: '400', marginTop: -6, marginBottom: 6 }]}>
              Paste direct image URLs (JPEG/PNG). Customers see these in search results.
            </Text>
            {form.images.map((url, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TextInput
                  style={[styles.fieldInput, { flex: 1, marginBottom: 0 }]}
                  value={url}
                  onChangeText={(v) => {
                    const updated = [...form.images]
                    updated[idx] = v
                    setForm((prev) => ({ ...prev, images: updated }))
                  }}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor={Colors.textSecondary}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <TouchableOpacity
                  onPress={() => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                  style={{ padding: 8 }}
                >
                  <Text style={{ color: Colors.error, fontSize: 16, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {form.images.length < 5 && (
              <TouchableOpacity
                onPress={() => setForm((prev) => ({ ...prev, images: [...prev.images, ''] }))}
                style={styles.addImageBtn}
              >
                <Text style={styles.addImageBtnText}>+ Add Image URL</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function CatalogueScreen() {
  const { apiFetch } = useApi()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPart, setEditingPart] = useState<Part | null>(null)

  const {
    items: parts,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    total,
    query,
    setQuery,
    onRefresh,
    onLoadMore,
    updateItem,
    removeItem,
  } = useLoadMore<Part>({
    buildPath: (page, q) => {
      const params = new URLSearchParams({ mine: 'true', limit: '20', page: String(page) })
      if (q.trim()) params.set('q', q.trim())
      return `/v1/parts?${params}`
    },
  })

  function openCreate() {
    setEditingPart(null)
    setModalVisible(true)
  }

  function openEdit(part: Part) {
    setEditingPart(part)
    setModalVisible(true)
  }

  async function handleSave(form: PartForm) {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      oemNumber: form.oemNumber.trim() || undefined,
      condition: form.condition,
      price: parseFloat(form.price),
      currency: form.currency,
      country: form.country,
      stockStatus: form.stockStatus,
      images: form.images.filter((u) => u.trim().length > 0),
    }

    if (editingPart) {
      const res = await apiFetch<{ data: Part }>(`/v1/parts/${editingPart.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      updateItem(editingPart.id, res.data)
    } else {
      const res = await apiFetch<{ data: Part }>('/v1/parts', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      // Refresh to pick up new item at top
      await onRefresh()
      void res
    }
    setModalVisible(false)
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
              removeItem(id)
            } catch {
              Alert.alert('Error', 'Delete failed. Try again.')
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
        <View>
          <Text style={styles.title}>My Catalogue</Text>
          <Text style={styles.count}>{total} listing{total !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add Part</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search your listings…"
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={parts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange500} />}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No parts listed yet.</Text>
            <TouchableOpacity onPress={openCreate} style={[styles.addBtn, { marginTop: 12 }]}>
              <Text style={styles.addBtnText}>+ Add Your First Part</Text>
            </TouchableOpacity>
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
                <Text style={styles.partName}>{item.name}</Text>
                {item.oemNumber ? <Text style={styles.oemNumber}>{item.oemNumber}</Text> : null}
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>Remove</Text>
                </TouchableOpacity>
              </View>
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
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  count: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: { backgroundColor: Colors.orange500, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },
  searchRow: { paddingHorizontal: 20, paddingBottom: 12 },
  searchInput: {
    backgroundColor: Colors.navy900,
    borderWidth: 1,
    borderColor: Colors.navy700,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  errorText: { color: Colors.error, fontSize: 13, paddingHorizontal: 20, marginBottom: 8 },
  list: { padding: 20, gap: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, color: Colors.orange500, fontWeight: '600' },
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
  cardActions: { flexDirection: 'row', gap: 8, paddingLeft: 12, paddingTop: 2 },
  editBtn: {},
  editText: { fontSize: 12, color: Colors.orange500 },
  deleteBtn: {},
  deleteText: { fontSize: 12, color: Colors.error },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, color: Colors.textSecondary },
  price: { marginLeft: 'auto', fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.navy950 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy700,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  modalCancel: { paddingVertical: 4 },
  modalCancelText: { fontSize: 15, color: Colors.textSecondary },
  modalSave: { paddingVertical: 4 },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: Colors.orange500 },
  modalBody: { padding: 20, gap: 4, paddingBottom: 60 },
  formError: { color: Colors.error, fontSize: 13, marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  fieldInput: {
    backgroundColor: Colors.navy900,
    borderWidth: 1,
    borderColor: Colors.navy700,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  fieldTextarea: { minHeight: 80, paddingTop: 11 },
  segment: { flexDirection: 'row', backgroundColor: Colors.navy900, borderRadius: 10, borderWidth: 1, borderColor: Colors.navy700, overflow: 'hidden' },
  segmentItem: { flex: 1, paddingVertical: 9, alignItems: 'center' },
  segmentActive: { backgroundColor: Colors.orange500 },
  segmentText: { fontSize: 13, color: Colors.textSecondary },
  segmentTextActive: { color: '#000', fontWeight: '700' },
  priceRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  currencyBox: { width: 120 },
  addImageBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.orange500,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  addImageBtnText: { fontSize: 13, color: Colors.orange500, fontWeight: '600' },
})
