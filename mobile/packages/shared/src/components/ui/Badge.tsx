import { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../theme/ThemeProvider'
import type { ThemeColors } from '../../theme/colors'

type BadgeVariant = 'oem' | 'aftermarket' | 'used' | 'success' | 'warning' | 'danger' | 'default'

function variantColors(c: ThemeColors): Record<BadgeVariant, { bg: string; text: string }> {
  return {
    oem: { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA' },
    aftermarket: { bg: 'rgba(168,85,247,0.15)', text: '#C084FC' },
    used: { bg: 'rgba(245,166,35,0.15)', text: c.orange500 },
    success: { bg: 'rgba(34,197,94,0.15)', text: c.success },
    warning: { bg: 'rgba(245,166,35,0.15)', text: c.warning },
    danger: { bg: 'rgba(239,68,68,0.15)', text: c.error },
    default: { bg: c.navy700, text: c.textSecondary },
  }
}

export function Badge({ label, variant = 'default' }: { label: string; variant?: BadgeVariant }) {
  const { colors } = useTheme()
  const palette = useMemo(() => variantColors(colors), [colors])
  const badgeColors = palette[variant]
  return (
    <View style={[styles.badge, { backgroundColor: badgeColors.bg }]}>
      <Text style={[styles.text, { color: badgeColors.text }]}>{label}</Text>
    </View>
  )
}

export function ConditionBadge({ condition }: { condition: string }) {
  const label =
    condition === 'oem' ? 'OEM' : condition === 'aftermarket' ? 'Aftermarket' : condition === 'used' ? 'Used' : condition
  const variant = (['oem', 'aftermarket', 'used'].includes(condition) ? condition : 'default') as BadgeVariant
  return <Badge label={label} variant={variant} />
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  text: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
})
