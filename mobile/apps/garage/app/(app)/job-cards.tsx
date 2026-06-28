import {useState, useMemo} from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApi, useLoadMore, useTheme, useThemedStyles, type ThemeColors} from '@velopx/shared'

type JobCardStatus = 'waiting_for_parts' | 'in_progress' | 'complete'

interface JobCard {
  id: string
  status: JobCardStatus
  customerName: string
  vehicleReg: string | null
  description: string
  mechanic: string | null
  claimReference: string | null
  createdAt: string
  updatedAt: string
}

const STATUS_LABEL: Record<JobCardStatus, string> = {
  waiting_for_parts: 'Waiting for Parts',
  in_progress: 'In Progress',
  complete: 'Complete',
}

function jobStatusColours(colors: ThemeColors): Record<JobCardStatus, { bg: string; text: string; border: string }> {
  return {
    waiting_for_parts: { bg: colors.warning + '1A', text: colors.warning, border: colors.warning + '4D' },
    in_progress: { bg: colors.info + '1A', text: colors.info, border: colors.info + '4D' },
    complete: { bg: colors.success + '1A', text: colors.success, border: colors.success + '4D' },
  }
}

const NEXT_STATUS: Partial<Record<JobCardStatus, JobCardStatus>> = {
  waiting_for_parts: 'in_progress',
  in_progress: 'complete',
}

const NEXT_LABEL: Partial<Record<JobCardStatus, string>> = {
  waiting_for_parts: 'Start Work',
  in_progress: 'Mark Complete',
}

const EMPTY_FORM = {
  customerName: '',
  vehicleReg: '',
  description: '',
  mechanic: '',
  claimReference: '',
}

export default function JobCardsScreen() {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const STATUS_COLOURS = useMemo(() => jobStatusColours(colors), [colors])
  const { apiFetch } = useApi()
  const { items: cards, loading, loadingMore, refreshing, hasMore, total,
          query, setQuery, onRefresh, onLoadMore, updateItem } = useLoadMore<JobCard>({
    buildPath: (page, q) => {
      const params = new URLSearchParams({ limit: '20', page: String(page) })
      if (q.trim()) params.set('q', q.trim())
      return `/v1/job-cards?${params}`
    },
  })

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [advancingId, setAdvancingId] = useState<string | null>(null)

  function openCreate() {
    setForm(EMPTY_FORM)
    setCreateError(null)
    setShowCreate(true)
  }

  async function handleCreate() {
    if (!form.customerName.trim() || !form.description.trim()) {
      setCreateError('Customer name and description are required.')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      await apiFetch('/v1/job-cards', {
        method: 'POST',
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          vehicleReg: form.vehicleReg.trim() || undefined,
          description: form.description.trim(),
          mechanic: form.mechanic.trim() || undefined,
          claimReference: form.claimReference.trim() || undefined,
        }),
      })
      setShowCreate(false)
      onRefresh()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating(false)
    }
  }

  async function advanceStatus(card: JobCard) {
    const next = NEXT_STATUS[card.status]
    if (!next) return
    setAdvancingId(card.id)
    try {
      await apiFetch(`/v1/job-cards/${card.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      })
      updateItem(card.id, { status: next })
    } catch {
      // non-critical, user can retry
    } finally {
      setAdvancingId(null)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Job Cards</Text>
          <Text style={styles.headerCount}>{total} card{total !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={openCreate}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search customer, vehicle, claim…"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.orange500} />
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange500} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No job cards yet. Tap + New to create one.</Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.orange500} style={{ paddingVertical: 16 }} />
            ) : hasMore ? (
              <TouchableOpacity onPress={onLoadMore} style={styles.loadMoreBtn}>
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item: card }) => {
            const palette = STATUS_COLOURS[card.status]
            const nextLabel = NEXT_LABEL[card.status]
            return (
              <View style={styles.card}>
                {/* Top row */}
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.customerName}>{card.customerName}</Text>
                    {card.vehicleReg && (
                      <Text style={styles.vehicleReg}>{card.vehicleReg}</Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: palette.bg, borderColor: palette.border }]}>
                    <Text style={[styles.statusText, { color: palette.text }]}>
                      {STATUS_LABEL[card.status]}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.description} numberOfLines={2}>{card.description}</Text>

                {/* Meta row */}
                <View style={styles.metaRow}>
                  {card.mechanic && (
                    <Text style={styles.metaText}>🔧 {card.mechanic}</Text>
                  )}
                  {card.claimReference && (
                    <Text style={styles.metaText}>📋 {card.claimReference}</Text>
                  )}
                  <Text style={styles.metaText}>
                    {new Date(card.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short',
                    })}
                  </Text>
                </View>

                {/* Advance button */}
                {nextLabel && card.status !== 'complete' && (
                  <TouchableOpacity
                    style={styles.advanceBtn}
                    onPress={() => advanceStatus(card)}
                    disabled={advancingId === card.id}
                  >
                    {advancingId === card.id ? (
                      <ActivityIndicator size="small" color={colors.orange500} />
                    ) : (
                      <Text style={styles.advanceBtnText}>{nextLabel} →</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )
          }}
        />
      )}

      {/* Create modal */}
      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowCreate(false)} />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Job Card</Text>

            {createError && <Text style={styles.errorText}>{createError}</Text>}

            <Text style={styles.fieldLabel}>Customer Name *</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.customerName}
              onChangeText={(v) => setForm((f) => ({ ...f, customerName: v }))}
              placeholder="e.g. John Banda"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Vehicle Reg</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.vehicleReg}
              onChangeText={(v) => setForm((f) => ({ ...f, vehicleReg: v }))}
              placeholder="e.g. KCA 123A"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
            />

            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[styles.fieldInput, { height: 72, textAlignVertical: 'top' }]}
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              placeholder="Work to be done…"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <Text style={styles.fieldLabel}>Mechanic</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.mechanic}
              onChangeText={(v) => setForm((f) => ({ ...f, mechanic: v }))}
              placeholder="e.g. James Odhiambo"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Claim Reference</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.claimReference}
              onChangeText={(v) => setForm((f) => ({ ...f, claimReference: v }))}
              placeholder="e.g. CLM-2025-0001"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreate(false)}
                disabled={creating}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, creating && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createBtnText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.navy950 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { color: c.textPrimary, fontSize: 22, fontWeight: '700' },
  headerCount: { color: c.textSecondary, fontSize: 13, marginTop: 2 },
  newBtn: {
    backgroundColor: c.orange500,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: { backgroundColor: c.navy900, borderWidth: 1, borderColor: c.navy700, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: c.textPrimary },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  emptyText: { textAlign: 'center', color: c.textMuted, fontSize: 14, marginTop: 64 },
  errorText: { color: c.error, fontSize: 12, fontFamily: 'monospace', marginBottom: 8 },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, color: c.orange500, fontWeight: '600' },
  // Card
  card: {
    backgroundColor: c.navy900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.navy700,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  customerName: { color: c.textPrimary, fontSize: 15, fontWeight: '600' },
  vehicleReg: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  description: { color: c.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  metaText: { color: c.textMuted, fontSize: 12 },
  advanceBtn: {
    borderTopWidth: 1,
    borderTopColor: c.navy700,
    paddingTop: 12,
    alignItems: 'center',
  },
  advanceBtnText: { color: c.orange500, fontSize: 14, fontWeight: '600' },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalBox: {
    backgroundColor: c.navy900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  modalTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  fieldLabel: {
    color: c.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: c.navy950,
    borderWidth: 1,
    borderColor: c.navy700,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: c.textPrimary,
    fontSize: 14,
    marginBottom: 14,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.navy700,
    alignItems: 'center',
  },
  cancelText: { color: c.textSecondary, fontSize: 14, fontWeight: '600' },
  createBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: c.orange500,
    alignItems: 'center',
  },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})
}
