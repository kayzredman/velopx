import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useUser, useAuth } from '@clerk/clerk-expo'
import { ThemeToggle, useTheme, useThemedStyles, type ThemeColors } from '@velopx/shared'

function InfoRow({
  label,
  value,
  styles,
}: {
  label: string
  value: string
  styles: ReturnType<typeof createStyles>
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  )
}

export default function DealerProfileScreen() {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const { user } = useUser()
  const { signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoading(true)
          try {
            await signOut()
            router.replace('/(auth)/sign-in')
          } catch {
            Alert.alert('Error', 'Failed to sign out. Please try again.')
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  const fullName = user?.fullName ?? user?.username ?? '—'
  const email = user?.primaryEmailAddress?.emailAddress ?? '—'
  const initials =
    fullName !== '—'
      ? fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '?'

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>Dealer</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <ThemeToggle />
        </View>

        <View style={styles.infoCard}>
          <InfoRow label="Name" value={fullName} styles={styles} />
          <InfoRow label="Email" value={email} styles={styles} />
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => void handleSignOut()}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={styles.signOutText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.navy950 },
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
    header: { marginBottom: 28 },
    title: { fontSize: 24, fontWeight: '700', color: c.textPrimary },
    avatarSection: { alignItems: 'center', marginBottom: 28 },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.navy700,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    avatarText: { fontSize: 28, fontWeight: '700', color: c.orange500 },
    name: { fontSize: 18, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },
    email: { fontSize: 13, color: c.textSecondary, marginBottom: 10 },
    rolePill: {
      backgroundColor: c.navy700,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    roleText: {
      fontSize: 11,
      fontWeight: '600',
      color: c.orange500,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    section: { marginBottom: 24, gap: 10 },
    sectionLabel: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    infoCard: {
      backgroundColor: c.navy800,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.navy700,
      marginBottom: 24,
      overflow: 'hidden',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.navy700,
    },
    infoLabel: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
    infoValue: {
      fontSize: 13,
      color: c.textPrimary,
      fontWeight: '500',
      maxWidth: '60%',
      textAlign: 'right',
    },
    signOutBtn: {
      borderWidth: 1,
      borderColor: c.error,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    signOutText: { color: c.error, fontWeight: '700', fontSize: 15 },
  })
}
