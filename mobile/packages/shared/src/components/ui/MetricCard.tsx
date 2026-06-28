import { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { FontFamily } from '../../hooks/useFonts'
import { useTheme } from '../../theme/ThemeProvider'
import type { ThemeColors } from '../../theme/colors'

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.navy900,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.navy700,
      padding: 20,
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: c.textSecondary,
    },
    value: {
      fontFamily: FontFamily.display,
      fontSize: 32,
      fontWeight: '700',
      color: c.textPrimary,
      marginTop: 8,
    },
    accent: { color: c.orange500 },
  })
}

export function MetricCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: boolean
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent && styles.accent]}>{value}</Text>
    </View>
  )
}
