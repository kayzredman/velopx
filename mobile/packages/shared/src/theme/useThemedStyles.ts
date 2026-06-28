import { useMemo } from 'react'
import type { StyleSheet } from 'react-native'
import { useTheme } from './ThemeProvider'
import type { ThemeColors } from './colors'

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ThemeColors) => T,
): T {
  const { colors } = useTheme()
  return useMemo(() => factory(colors), [colors, factory])
}
