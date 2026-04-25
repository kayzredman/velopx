import React, { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from 'react-native'
import { Colors } from '../constants/colors'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  rightIcon?: React.ReactNode
}

export function Input({
  label,
  error,
  rightIcon,
  secureTextEntry,
  style,
  ...rest
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isPassword = secureTextEntry === true

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.orange500}
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

        {rightIcon && !isPassword && (
          <View style={styles.iconBtn}>{rightIcon}</View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navy800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.navy700,
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  iconBtn: {
    paddingLeft: 8,
  },
  iconText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
  },
})
