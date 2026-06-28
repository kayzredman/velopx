import { useSignUp, useOAuth } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { useRouter } from 'expo-router'
import {useCallback, useState, useMemo} from 'react'
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
import {Button, Input, Logo, useTheme, useThemedStyles, type ThemeColors} from '@velopx/shared'
import { Colors } from '@velopx/shared'

WebBrowser.maybeCompleteAuthSession()

type Step = 'form' | 'verify'

export default function SignUpScreen() {
  const styles = useThemedStyles(createStyles)
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()

  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' })
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' })

  const [step, setStep] = useState<Step>('form')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
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
          redirectUrl: Linking.createURL('/', { scheme: 'velopx-garage' }),
        })
        if (createdSessionId && oAuthSetActive) {
          await oAuthSetActive({ session: createdSessionId })
          router.replace('/(app)')
        }
      } catch (err: unknown) {
        let message = 'Sign up failed. Please try again.'
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

  async function handleSignUp() {
    if (!isLoaded) return
    setLoading(true)
    setError('')

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email.trim().toLowerCase(),
        password,
        unsafeMetadata: { role: 'garage_owner' },
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStep('verify')
    } catch (err: unknown) {
      let message = 'Sign up failed. Please try again.'
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

  async function handleVerify() {
    if (!isLoaded) return
    setLoading(true)
    setError('')

    try {
      const result = await signUp.attemptEmailAddressVerification({ code })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/(app)')
      } else {
        setError('Verification incomplete. Try again.')
      }
    } catch (err: unknown) {
      let message = 'Verification failed. Please try again.'
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

          {step === 'form' ? (
            <>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Join velopX as a garage</Text>

              <View style={styles.form}>
                <SocialButton
                  symbol=""
                  label="Continue with Apple"
                  loading={oauthLoading === 'apple'}
                  disabled={loading || oauthLoading !== null}
                  onPress={() => handleOAuth('apple')}
                />
                <SocialButton
                  symbol="G"
                  symbolColor="#4285F4"
                  label="Continue with Google"
                  loading={oauthLoading === 'google'}
                  disabled={loading || oauthLoading !== null}
                  onPress={() => handleOAuth('google')}
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or sign up with email</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Input
                      label="First name"
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Ada"
                    />
                  </View>
                  <View style={styles.flex}>
                    <Input
                      label="Last name"
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Osei"
                    />
                  </View>
                </View>

                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a strong password"
                  secureTextEntry
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button label="Create Account" onPress={handleSignUp} loading={loading} fullWidth />

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account?</Text>
                  <Text style={styles.link} onPress={() => router.back()}>
                    {' '}Sign in
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>We sent a code to {email}</Text>

              <View style={styles.form}>
                <Input
                  label="Verification code"
                  value={code}
                  onChangeText={setCode}
                  placeholder="Enter 6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button label="Verify Email" onPress={handleVerify} loading={loading} fullWidth />

                <Text
                  style={[styles.link, { textAlign: 'center' }]}
                  onPress={() => setStep('form')}
                >
                  ← Back
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.navy950 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  logo: { alignSelf: 'center', marginBottom: 32 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: c.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
  },
  form: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: c.navy800,
    borderWidth: 1,
    borderColor: c.navy700,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialBtnDisabled: { opacity: 0.5 },
  socialSymbol: { fontSize: 17, color: c.textPrimary, fontWeight: '700' },
  socialLabel: { fontSize: 15, color: c.textPrimary, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: c.navy700 },
  dividerText: { fontSize: 12, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  error: {
    color: c.error,
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  footerText: { color: c.textSecondary, fontSize: 13 },
  link: { color: c.orange500, fontSize: 13 },
})
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
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      style={[styles.socialBtn, disabled && styles.socialBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} size="small" />
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
