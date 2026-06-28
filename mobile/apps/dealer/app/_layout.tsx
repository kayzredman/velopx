import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { ThemeProvider, useTheme, useVelopXFonts } from '@velopx/shared'

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  clearToken: (key: string) => SecureStore.deleteItemAsync(key),
}

function AuthGuard() {
  const { isSignedIn, isLoaded } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!isSignedIn && !inAuthGroup) router.replace('/(auth)/sign-in')
    else if (isSignedIn && inAuthGroup) router.replace('/(app)')
  }, [isSignedIn, isLoaded, segments, router])

  return <Slot />
}

function AppShell() {
  const { colors } = useTheme()
  const { loaded } = useVelopXFonts()

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.navy950, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.orange500} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.navy950 }}>
      <StatusBar style={colors.statusBar} backgroundColor={colors.navy950} />
      <AuthGuard />
    </View>
  )
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set')

  return (
    <ThemeProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <AppShell />
      </ClerkProvider>
    </ThemeProvider>
  )
}
