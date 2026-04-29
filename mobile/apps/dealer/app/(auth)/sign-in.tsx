import { useSignIn, useOAuth } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input, Logo } from '@velopx/shared'
import { Colors } from '@velopx/shared'

// Required to dismiss the in-app browser after OAuth completes (Android)
WebBrowser.maybeCompleteAuthSession()

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' })
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'apple' | 'google' | null>(null)

  const handleOAuth = useCallback(
    async (strategy: 'apple' | 'google') => {
      setError('')
      setOauthLoading(strategy)
      try {
        const startFlow = strategy === 'apple' ? startAppleOAuth : startGoogleOAuth
        const { createdSessionId, setActive: oAuthSetActive } = await startFlow({
          redirectUrl: Linking.createURL('/', { scheme: 'velopx-dealer' }),
        })
        if (createdSessionId && oAuthSetActive) {
          await oAuthSetActive({ session: createdSessionId })
          router.replace('/(app)')
        }
      } catch (err: unknown) {
        let message = 'Sign in failed. Please try again.'
        if (err && typeof err === 'object' && 'errors' in err) {
          const clerkErr = err as { errors: Array<{ message?: string }> }
          message = clerkErr.errors?.[0]?.message ?? message
        } else if (err instanceof Error && err.message && !err.message.includes('toString')) {
          message = err.message
        }
        setError(message)
      } finally {
        setOauthLoading(null)
      }
    },
    [router, startAppleOAuth, startGoogleOAuth],
  )

  async function handleSignIn() {
    if (!isLoaded) return
    setLoading(true)
    setError('')

    try {
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/(app)')
      } else {
        setError('Sign in incomplete. Check your credentials.')
      }
    } catch (err: unknown) {
      let message = 'Sign in failed. Please try again.'
      if (err && typeof err === 'object' && 'errors' in err) {
        const clerkErr = err as { errors: Array<{ message?: string }> }
        message = clerkErr.errors?.[0]?.message ?? message
      } else if (err instanceof Error && err.message && !err.message.includes('toString')) {
        message = err.message
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const busy = loading || oauthLoading !== null

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Logo size="lg" style={styles.logo} />

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your dealer account</Text>

          <View style={styles.form}>
            {/* ── Social sign-in ── */}
            <SocialButton
              symbol=""
              label="Continue with Apple"
              loading={oauthLoading === 'apple'}
              disabled={busy}
              onPress={() => handleOAuth('apple')}
            />
            <SocialButton
              symbol="G"
              symbolColor="#4285F4"
              label="Continue with Google"
              loading={oauthLoading === 'google'}
              disabled={busy}
              onPress={() => handleOAuth('google')}
            />

            {/* ── Divider ── */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Email form ── */}
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!busy}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              editable={!busy}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label="Sign In"
              onPress={handleSignIn}
              loading={loading}
              disabled={busy}
              fullWidth
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Text
                style={styles.link}
                onPress={() => router.push('/(auth)/sign-up')}
              >
                {' '}Sign up
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function SocialButton({
  symbol,
  symbolColor,
  label,
  loading,
  disabled,
  onPress,
}: {
  symbol: string
  symbolColor?: string
  label: string
  loading: boolean
  disabled: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.socialBtn, disabled && styles.socialBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textPrimary} size="small" />
      ) : (
        <>
          <Text style={[styles.socialSymbol, symbolColor ? { color: symbolColor } : null]}>
            {symbol}
          </Text>
          <Text style={styles.socialLabel}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.navy950,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  logo: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  socialBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.navy800,
    borderWidth: 1,
    borderColor: Colors.navy700,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialBtnDisabled: {
    opacity: 0.5,
  },
  socialSymbol: {
    fontSize: 17,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  socialLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.navy700,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  error: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: Colors.orange500,
    fontSize: 14,
    fontWeight: '600',
  },
})
