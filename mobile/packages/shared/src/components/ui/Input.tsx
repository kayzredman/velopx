import React, { useMemo, useState } from 'react'
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from 'react-native'
import { useTheme } from '../../theme/ThemeProvider'
import type { ThemeColors } from '../../theme/colors'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  rightIcon?: React.ReactNode
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { gap: 6 },
    label: { fontSize: 13, fontWeight: '500', color: c.textSecondary },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.navy800,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.navy700,
      paddingHorizontal: 14,
      height: 52,
    },
    inputError: { borderColor: c.error },
    input: { flex: 1, fontSize: 15, color: c.textPrimary },
    iconBtn: { paddingLeft: 8 },
    iconText: { fontSize: 16 },
    errorText: { fontSize: 12, color: c.error },
  })
}

export function Input({
  label,
  error,
  rightIcon,
  secureTextEntry,
  style,
  ...rest
}: InputProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isPassword = secureTextEntry === true

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.orange500}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible((v) => !v)}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Text style={styles.iconText}>{isPasswordVisible ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && <View style={styles.iconBtn}>{rightIcon}</View>}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}
