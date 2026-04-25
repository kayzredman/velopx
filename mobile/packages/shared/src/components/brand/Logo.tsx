import React from 'react'
import { Text, StyleSheet, type TextStyle } from 'react-native'
import { Colors } from '../../constants/colors'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  style?: TextStyle
}

const sizes = {
  sm: 24,
  md: 32,
  lg: 48,
}

export function Logo({ size = 'md', style }: LogoProps) {
  const fontSize = sizes[size]

  return (
    <Text style={[styles.base, { fontSize }, style]}>
      <Text style={styles.velop}>velop</Text>
      <Text style={styles.x}>X</Text>
    </Text>
  )
}

const styles = StyleSheet.create({
  base: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  velop: {
    color: Colors.textPrimary,
  },
  x: {
    color: Colors.orange500,
  },
})
