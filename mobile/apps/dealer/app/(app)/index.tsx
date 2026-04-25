import { useUser } from '@clerk/clerk-expo'
import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, useApi } from '@velopx/shared'

interface DashboardStats {
  activeListings: number
  pendingQuotes: number
  openOrders: number
}

export default function DealerDashboard() {
  const { user } = useUser()
  const { apiFetch } = useApi()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const [partsRes, ordersRes, quotesRes] = await Promise.all([
        apiFetch<{ data: unknown[]; meta?: { total: number } }>('/v1/parts?limit=1'),
        apiFetch<{ data: { status: string }[] }>('/v1/orders'),
        apiFetch<{ data: { status: string }[] }>('/v1/quotes/for-dealer'),
      ])

      const openOrders = ordersRes.data.filter((o) =>
        ['pending', 'confirmed', 'dispatched'].includes(o.status),
      ).length
      const pendingQuotes = quotesRes.data.filter((q) => q.status === 'pending').length

      setStats({
        activeListings: partsRes.meta?.total ?? partsRes.data.length,
        openOrders,
        pendingQuotes,
      })
    } catch {
      setStats({ activeListings: 0, openOrders: 0, pendingQuotes: 0 })
    }
  }, [apiFetch])

  useEffect(() => { fetchStats() }, [fetchStats])

  async function onRefresh() {
    setRefreshing(true)
    await fetchStats()
    setRefreshing(false)
  }

  const statCards = [
    { label: 'Active Listings', value: stats?.activeListings },
    { label: 'Pending Quotes', value: stats?.pendingQuotes },
    { label: 'Open Orders', value: stats?.openOrders },
  ]

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange500} />}
      >
        <Text style={styles.greeting}>Hey, {user?.firstName ?? 'there'} 👋</Text>
        <Text style={styles.subtitle}>Here's what's happening today</Text>

        <View style={styles.grid}>
          {statCards.map((stat) => (
            <View key={stat.label} style={styles.card}>
              <Text style={styles.cardLabel}>{stat.label}</Text>
              {stat.value === undefined ? (
                <ActivityIndicator color={Colors.orange500} style={{ marginTop: 8 }} />
              ) : (
                <Text style={styles.cardValue}>{stat.value}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.navy950,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: Colors.navy900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.navy700,
    padding: 20,
  },
  cardLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
})
