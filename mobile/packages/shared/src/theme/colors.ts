export type ThemeColors = {
  navy950: string
  navy900: string
  navy800: string
  navy700: string
  navy600: string
  orange500: string
  orange400: string
  orange300: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  success: string
  warning: string
  error: string
  info: string
  white: string
  black: string
  transparent: string
  statusBar: 'light' | 'dark'
}

export const darkColors: ThemeColors = {
  navy950: '#070C14',
  navy900: '#0C1526',
  navy800: '#111E34',
  navy700: '#1E2E48',
  navy600: '#2D4264',
  orange500: '#F5A623',
  orange400: '#F7BC5A',
  orange300: '#FAD08F',
  textPrimary: '#E8ECF1',
  textSecondary: '#8A97AA',
  textMuted: '#4A5568',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  statusBar: 'light',
}

export const lightColors: ThemeColors = {
  navy950: '#F4F6F9',
  navy900: '#FFFFFF',
  navy800: '#EEF2F7',
  navy700: '#D8E0EA',
  navy600: '#B8C4D4',
  orange500: '#E09410',
  orange400: '#F5A623',
  orange300: '#F7BC5A',
  textPrimary: '#0C1526',
  textSecondary: '#4A5568',
  textMuted: '#8A97AA',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  statusBar: 'dark',
}

/** @deprecated Use `useTheme().colors` for theme-aware styling */
export const Colors = darkColors

export type ColorKey = keyof ThemeColors
export type ThemeMode = 'light' | 'dark' | 'system'
