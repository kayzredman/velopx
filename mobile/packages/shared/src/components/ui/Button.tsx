import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
} from 'react-native'
import { Colors } from '../constants/colors'

interface ButtonProps extends TouchableOpacityProps {
  label: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
  fullWidth?: boolean
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
          color={variant === 'primary' ? Colors.black : Colors.orange500}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  // ── Variants
  primary: {
    backgroundColor: Colors.orange500,
  },
  secondary: {
    backgroundColor: Colors.navy800,
    borderWidth: 1,
    borderColor: Colors.navy700,
  },
  ghost: {
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    borderColor: Colors.navy700,
  },
  danger: {
    backgroundColor: Colors.error,
  },
  // ── Labels
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryLabel: {
    color: Colors.black,
  },
  secondaryLabel: {
    color: Colors.textPrimary,
  },
  ghostLabel: {
    color: Colors.textPrimary,
  },
  dangerLabel: {
    color: Colors.white,
  },
})
