import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { ThemeMode } from '../../theme/colors'
import { useTheme } from '../../theme/ThemeProvider'

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'Auto' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
]

export function ThemeToggle() {
  const { mode, setMode, colors } = useTheme()

  return (
    <View style={[styles.row, { backgroundColor: colors.navy800, borderColor: colors.navy700 }]}>
      {OPTIONS.map((opt) => {
        const active = mode === opt.mode
        return (
          <TouchableOpacity
            key={opt.mode}
            style={[
              styles.chip,
              active && { backgroundColor: colors.orange500 },
            ]}
            onPress={() => setMode(opt.mode)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.chipText,
                { color: active ? colors.black : colors.textSecondary },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  chip: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
})
