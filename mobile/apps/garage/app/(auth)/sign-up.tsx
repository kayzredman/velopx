import { useSignUp } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input, Logo, Colors } from '@velopx/shared'

type Step = 'form' | 'verify'

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()

  const [step, setStep] = useState<Step>('form')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStep('verify')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed.')
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
      setError(err instanceof Error ? err.message : 'Verification failed.')
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy950 },
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
  form: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  error: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  footerText: { color: Colors.textSecondary, fontSize: 13 },
  link: { color: Colors.orange500, fontSize: 13 },
})
