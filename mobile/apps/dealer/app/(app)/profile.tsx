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
import { Colors } from '@velopx/shared'

export default function DealerProfileScreen() {
  const { user }    = useUser()
  const { signOut } = useAuth()
  const router      = useRouter()
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
  const email    = user?.primaryEmailAddress?.emailAddress ?? '—'
  const initials = fullName !== '—'
    ? fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Avatar + name */}
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

        {/* Info rows */}
        <View style={styles.infoCard}>
          <InfoRow label="Name"  value={fullName} />
          <InfoRow label="Email" value={email} />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => void handleSignOut()}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={Colors.error} />
            : <Text style={styles.signOutText}>Sign Out</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.navy900,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.navy700,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.orange500,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  rolePill: {
    backgroundColor: Colors.navy700,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.orange500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoCard: {
    backgroundColor: Colors.navy800,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.navy700,
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
    borderBottomColor: Colors.navy700,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  signOutBtn: {
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 15,
  },
})
