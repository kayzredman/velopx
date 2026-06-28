import * as SecureStore from 'expo-secure-store'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useColorScheme } from 'react-native'
import { darkColors, lightColors, type ThemeColors, type ThemeMode } from './colors'

const STORAGE_KEY = 'velopx_theme_mode'

type ThemeContextValue = {
  mode: ThemeMode
  resolved: 'light' | 'dark'
  colors: ThemeColors
  isDark: boolean
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function buildValue(
  mode: ThemeMode,
  systemScheme: 'light' | 'dark' | null | undefined,
  setMode: (mode: ThemeMode) => void,
): ThemeContextValue {
  const resolved: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode
  return {
    mode,
    resolved,
    colors: resolved === 'dark' ? darkColors : lightColors,
    isDark: resolved === 'dark',
    setMode,
  }
}

function resolveSystemScheme(scheme: ReturnType<typeof useColorScheme>): 'light' | 'dark' {
  return scheme === 'light' ? 'light' : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = resolveSystemScheme(useColorScheme())
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored)
        }
      })
      .finally(() => setReady(true))
  }, [])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    void SecureStore.setItemAsync(STORAGE_KEY, next)
  }, [])

  const value = useMemo(
    () => buildValue(mode, systemScheme, setMode),
    [mode, systemScheme, setMode],
  )

  const fallback = useMemo(
    () => buildValue('dark', systemScheme, setMode),
    [systemScheme, setMode],
  )

  return (
    <ThemeContext.Provider value={ready ? value : fallback}>{children}</ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
