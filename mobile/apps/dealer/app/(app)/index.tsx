import { useAuth, useUser } from '@clerk/clerk-expo'
import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, MetricCard, ErrorBanner, useApi, FontFamily } from '@velopx/shared'

interface DashboardStats {
  activeListings: number
  pendingQuotes: number
  openOrders: number
}

export default function DealerDashboard() {
  const { user } = useUser()
  const { signOut } = useAuth()
  const { apiFetch } = useApi()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchStats = useCallback(async () => {
    setError('')
    try {
      const [partsRes, ordersRes, quotesRes] = await Promise.all([
        apiFetch<{ data: unknown[]; meta?: { total: number } }>('/v1/parts/mine?limit=1'),
        apiFetch<{ data: { status: string }[] }>('/v1/orders/for-dealer'),
        apiFetch<{ data: { status: string }[] }>('/v1/quotes/for-dealer'),
      ])

      setStats({
        activeListings: partsRes.meta?.total ?? 0,
        openOrders: ordersRes.data.filter((o) => ['pending', 'confirmed', 'dispatched'].includes(o.status)).length,
        pendingQuotes: quotesRes.data.filter((q) => q.status === 'pending').length,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    }
  }, [apiFetch])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchStats(); setRefreshing(false) }} tintColor={Colors.orange500} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hey, {user?.firstName ?? 'there'}</Text>
            <Text style={styles.subtitle}>Dealer dashboard</Text>
          </View>
          <TouchableOpacity onPress={() => signOut()}>
            <Text style={styles.signOut}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        {!stats ? (
          <ActivityIndicator color={Colors.orange500} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.grid}>
            <MetricCard label="Active Listings" value={stats.activeListings} accent />
            <MetricCard label="Pending RFQs" value={stats.pendingQuotes} />
            <MetricCard label="Open Orders" value={stats.openOrders} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy950 },
  content: { padding: 20, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontFamily: FontFamily.display, fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  signOut: { color: Colors.textSecondary, fontSize: 13 },
  grid: { gap: 12 },
})
