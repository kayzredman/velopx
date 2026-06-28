import { useEffect, useState } from 'react'
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { Button, Input, useApi, useTheme, useThemedStyles, type ThemeColors } from '@velopx/shared'

export interface PartFormValues {
  name: string
  oemNumber: string
  description: string
  condition: 'oem' | 'aftermarket' | 'used'
  price: string
  currency: string
  country: string
  stockStatus: 'in_stock' | 'out_of_stock' | 'limited'
}

export const BLANK_PART_FORM: PartFormValues = {
  name: '',
  oemNumber: '',
  description: '',
  condition: 'oem',
  price: '',
  currency: 'GHS',
  country: 'GH',
  stockStatus: 'in_stock',
}

const CONDITIONS: PartFormValues['condition'][] = ['oem', 'aftermarket', 'used']
const STOCK_OPTIONS: PartFormValues['stockStatus'][] = ['in_stock', 'limited', 'out_of_stock']

const CONDITION_LABELS: Record<PartFormValues['condition'], string> = {
  oem: 'OEM',
  aftermarket: 'Aftermarket',
  used: 'Used',
}

const STOCK_LABELS: Record<PartFormValues['stockStatus'], string> = {
  in_stock: 'In stock',
  limited: 'Limited',
  out_of_stock: 'Out of stock',
}

interface PartFormModalProps {
  visible: boolean
  partId?: string
  initial?: PartFormValues | null
  onClose: () => void
  onSaved: () => void
}

export function PartFormModal({ visible, partId, initial, onClose, onSaved }: PartFormModalProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { apiFetch } = useApi()
  const isEdit = !!partId
  const [form, setForm] = useState<PartFormValues>(BLANK_PART_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (visible) {
      setForm(initial ?? BLANK_PART_FORM)
      setFormError('')
    }
  }, [visible, initial])

  async function handleSave() {
    const price = parseFloat(form.price)
    if (!form.name.trim()) {
      setFormError('Part name is required')
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Enter a valid price')
      return
    }
    if (form.country.trim().length !== 2) {
      setFormError('Country must be a 2-letter code (e.g. GH)')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: form.name.trim(),
        oemNumber: form.oemNumber.trim() || undefined,
        description: form.description.trim() || undefined,
        condition: form.condition,
        price,
        currency: form.currency.trim().toUpperCase() || 'GHS',
        country: form.country.trim().toUpperCase(),
        stockStatus: form.stockStatus,
        images: [] as string[],
      }

      if (isEdit) {
        await apiFetch(`/v1/parts/${partId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/v1/parts', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      onSaved()
      onClose()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>{isEdit ? 'Edit Part' : 'Add Part'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Input
              label="Part name"
              value={form.name}
              onChangeText={(name) => setForm((f) => ({ ...f, name }))}
              placeholder="e.g. Front bumper"
            />
            <Input
              label="OEM number"
              value={form.oemNumber}
              onChangeText={(oemNumber) => setForm((f) => ({ ...f, oemNumber }))}
              placeholder="Optional"
            />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.textArea}
                value={form.description}
                onChangeText={(description) => setForm((f) => ({ ...f, description }))}
                placeholder="Optional details"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <Text style={styles.fieldLabel}>Condition</Text>
            <View style={styles.chipRow}>
              {CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, form.condition === c && styles.chipActive]}
                  onPress={() => setForm((f) => ({ ...f, condition: c }))}
                >
                  <Text style={[styles.chipText, form.condition === c && styles.chipTextActive]}>
                    {CONDITION_LABELS[c]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Input
                  label="Price"
                  value={form.price}
                  onChangeText={(price) => setForm((f) => ({ ...f, price }))}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.half}>
                <Input
                  label="Currency"
                  value={form.currency}
                  onChangeText={(currency) => setForm((f) => ({ ...f, currency }))}
                  placeholder="GHS"
                  autoCapitalize="characters"
                  maxLength={3}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Input
                  label="Country"
                  value={form.country}
                  onChangeText={(country) => setForm((f) => ({ ...f, country: country.toUpperCase() }))}
                  placeholder="GH"
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Stock</Text>
                <View style={styles.stockCol}>
                  {STOCK_OPTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, form.stockStatus === s && styles.chipActive]}
                      onPress={() => setForm((f) => ({ ...f, stockStatus: s }))}
                    >
                      <Text style={[styles.chipText, form.stockStatus === s && styles.chipTextActive]}>
                        {STOCK_LABELS[s]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <Button
              label={saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add to catalogue'}
              onPress={handleSave}
              disabled={saving}
              loading={saving}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: c.navy900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.navy700,
  },
  title: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  close: { fontSize: 18, color: c.textSecondary },
  form: { padding: 20, gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: c.textSecondary },
  textArea: {
    backgroundColor: c.navy800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.navy700,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: c.textPrimary,
    fontSize: 15,
    minHeight: 80,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stockCol: { gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.navy700,
    backgroundColor: c.navy800,
  },
  chipActive: { borderColor: c.orange500, backgroundColor: 'rgba(245,166,35,0.12)' },
  chipText: { fontSize: 12, color: c.textSecondary, fontWeight: '500' },
  chipTextActive: { color: c.orange500, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1, gap: 6 },
  error: { fontSize: 13, color: c.error },
})
}
