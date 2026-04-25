import { useSignIn } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input, Logo, Colors } from '@velopx/shared'

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
        setError('Sign in incomplete.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.navy950 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Logo size="lg" style={{ alignSelf: 'center', marginBottom: 32 }} />
          <Text style={styles.title}>Driver Sign In</Text>
          <Text style={styles.subtitle}>Accept deliveries, earn with velopX</Text>
          <View style={styles.form}>
            <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
            <Input label="Password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
            {error ? <Text style={{ color: Colors.error, textAlign: 'center', fontSize: 13 }}>{error}</Text> : null}
            <Button label="Sign In" onPress={handleSignIn} loading={loading} fullWidth />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 32 },
  form: { gap: 16 },
})
