/** velopX design tokens — single source of truth for all mobile apps */
export const Colors = {
  // Backgrounds
  navy950: '#070C14',
  navy900: '#0C1526',
  navy800: '#111E34',
  navy700: '#1E2E48',
  navy600: '#2D4264',

  // Accent
  orange500: '#F5A623',
  orange400: '#F7BC5A',
  orange300: '#FAD08F',

  // Text
  textPrimary: '#E8ECF1',
  textSecondary: '#8A97AA',
  textMuted: '#4A5568',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Common
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const

export type ColorKey = keyof typeof Colors
