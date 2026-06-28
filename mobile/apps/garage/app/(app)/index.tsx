import { useUser } from '@clerk/clerk-expo'
import {useCallback, useEffect, useState, useMemo} from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useApi, useTheme, useThemedStyles, type ThemeColors} from '@velopx/shared'

interface DashboardStats {
  activeQuotes: number
  openOrders: number
  pendingDeliveries: number
}

export default function GarageDashboard() {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { user } = useUser()
  const { apiFetch } = useApi()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [firstActiveDeliveryId, setFirstActiveDeliveryId] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const [quotesRes, ordersRes, deliveriesRes] = await Promise.all([
        apiFetch<{ data: { status: string }[] }>('/v1/quotes'),
        apiFetch<{ data: { status: string }[] }>('/v1/orders'),
        apiFetch<{ data: { id: string; status: string }[] }>('/v1/deliveries'),
      ])

      const activeDeliveries = deliveriesRes.data.filter((d) =>
        ['assigned', 'collected', 'in_transit'].includes(d.status),
      )
      setFirstActiveDeliveryId(activeDeliveries[0]?.id ?? null)

      setStats({
        activeQuotes: quotesRes.data.filter((q) => q.status === 'pending').length,
        openOrders: ordersRes.data.filter((o) =>
          ['pending', 'confirmed', 'dispatched'].includes(o.status),
        ).length,
        pendingDeliveries: activeDeliveries.length,
      })
    } catch {
      setStats({ activeQuotes: 0, openOrders: 0, pendingDeliveries: 0 })
    }
  }, [apiFetch])

  useEffect(() => { fetchStats() }, [fetchStats])

  async function onRefresh() {
    setRefreshing(true)
    await fetchStats()
    setRefreshing(false)
  }

  const statCards = [
    { label: 'Active Quotes', value: stats?.activeQuotes, trackable: false },
    { label: 'Open Orders', value: stats?.openOrders, trackable: false },
    { label: 'Pending Deliveries', value: stats?.pendingDeliveries, trackable: true },
  ]

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange500} />}
      >
        <Text style={styles.greeting}>Hey, {user?.firstName ?? 'there'} 👋</Text>
        <Text style={styles.subtitle}>Garage Dashboard</Text>

        {statCards.map((stat) => (
          <View key={stat.label} style={styles.card}>
            <Text style={styles.cardLabel}>{stat.label}</Text>
            {stat.value === undefined ? (
              <ActivityIndicator color={colors.orange500} style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.cardValue}>{stat.value}</Text>
            )}
            {stat.trackable && (stat.value ?? 0) > 0 && (
              <TouchableOpacity
                style={styles.trackBtn}
                onPress={() =>
                  router.push({ pathname: '/inbound/[id]', params: { id: firstActiveDeliveryId ?? '' } })
                }
              >
                <Text style={styles.trackBtnText}>Track Inbound →</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.navy950 },
  content: { padding: 20, gap: 12 },
  greeting: { fontSize: 24, fontWeight: '700', color: c.textPrimary },
  subtitle: { fontSize: 14, color: c.textSecondary, marginBottom: 12 },
  card: {
    backgroundColor: c.navy900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.navy700,
    padding: 20,
  },
  cardLabel: { fontSize: 13, color: c.textSecondary },
  cardValue: { fontSize: 32, fontWeight: '700', color: c.textPrimary, marginTop: 4 },
  trackBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.orange500,
  },
  trackBtnText: { fontSize: 12, fontWeight: '600', color: c.orange500 },
})
}
