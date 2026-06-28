import React, { useMemo } from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
} from 'react-native'
import { useTheme } from '../../theme/ThemeProvider'
import type { ThemeColors } from '../../theme/colors'

interface ButtonProps extends TouchableOpacityProps {
  label: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
  fullWidth?: boolean
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    base: {
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    fullWidth: { width: '100%' },
    disabled: { opacity: 0.5 },
    primary: { backgroundColor: c.orange500 },
    secondary: {
      backgroundColor: c.navy800,
      borderWidth: 1,
      borderColor: c.navy700,
    },
    ghost: {
      backgroundColor: c.transparent,
      borderWidth: 1,
      borderColor: c.navy700,
    },
    danger: { backgroundColor: c.error },
    label: { fontSize: 15, fontWeight: '600' },
    primaryLabel: { color: c.black },
    secondaryLabel: { color: c.textPrimary },
    ghostLabel: { color: c.textPrimary },
    dangerLabel: { color: c.white },
  })
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.black : colors.orange500}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}
