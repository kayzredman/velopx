import React, { useMemo } from 'react'
import { Text, StyleSheet, type TextStyle } from 'react-native'
import { useTheme } from '../../theme/ThemeProvider'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  style?: TextStyle
}

const sizes = { sm: 24, md: 32, lg: 48 }

export function Logo({ size = 'md', style }: LogoProps) {
  const { colors } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: { fontWeight: '700', letterSpacing: -0.5 },
        velop: { color: colors.textPrimary },
        x: { color: colors.orange500 },
      }),
    [colors],
  )

  return (
    <Text style={[styles.base, { fontSize: sizes[size] }, style]}>
      <Text style={styles.velop}>velop</Text>
      <Text style={styles.x}>X</Text>
    </Text>
  )
}
