import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { Colors } from '../../constants/colors'

type BadgeVariant = 'oem' | 'aftermarket' | 'used' | 'success' | 'warning' | 'danger' | 'default'

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  oem: { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA' },
  aftermarket: { bg: 'rgba(168,85,247,0.15)', text: '#C084FC' },
  used: { bg: 'rgba(245,166,35,0.15)', text: '#F5A623' },
  success: { bg: 'rgba(34,197,94,0.15)', text: Colors.success },
  warning: { bg: 'rgba(245,166,35,0.15)', text: Colors.warning },
  danger: { bg: 'rgba(239,68,68,0.15)', text: Colors.error },
  default: { bg: Colors.navy700, text: Colors.textSecondary },
}

export function Badge({ label, variant = 'default' }: { label: string; variant?: BadgeVariant }) {
  const colors = variantColors[variant]
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  )
}

export function ConditionBadge({ condition }: { condition: string }) {
  const label = condition === 'oem' ? 'OEM' : condition === 'aftermarket' ? 'Aftermarket' : condition === 'used' ? 'Used' : condition
  const variant = (['oem', 'aftermarket', 'used'].includes(condition) ? condition : 'default') as BadgeVariant
  return <Badge label={label} variant={variant} />
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  text: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
})
