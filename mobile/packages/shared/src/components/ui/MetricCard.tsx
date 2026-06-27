import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'
import { FontFamily } from '../../hooks/useFonts'

export function MetricCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent && styles.accent]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.navy900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.navy700,
    padding: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  value: {
    fontFamily: FontFamily.display,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  accent: { color: Colors.orange500 },
})
