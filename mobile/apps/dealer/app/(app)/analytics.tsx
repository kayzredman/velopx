import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApi, useTheme, useThemedStyles, type ThemeColors } from '@velopx/shared'

interface AnalyticsData {
  revenueMtd:    number
  revenueAllTime: number
  ordersMtd:     number
  ordersToday:   number
  avgOrderValue: number
  quoteWinRate:  number
  ordersByStatus: Record<string, number>
  topParts: Array<{ name: string; orderCount: number; revenue: number; currency: string }>
  monthlyRevenue: Array<{ month: string; revenue: number }>
}

function fmt(n: number, currency = 'GHS') {
  if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000)     return `${currency} ${(n / 1_000).toFixed(1)}k`
  return `${currency} ${n.toFixed(0)}`
}

export default function AnalyticsScreen() {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { apiFetch }            = useApi()
  const [data, setData]         = useState<AnalyticsData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: AnalyticsData }>('/v1/analytics/dealer')
      setData(res.data)
    } catch { /* keep */ } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [apiFetch])

  useEffect(() => { void fetchData() }, [fetchData])

  const onRefresh = () => {
    setRefreshing(true)
    void fetchData()
  }

  const now       = new Date()
  const currentMo = now.toLocaleString('default', { month: 'short' })
  const maxRev    = data
    ? Math.max(...data.monthlyRevenue.map((m) => m.revenue), 1)
    : 1

  const kpis = data
    ? [
        { label: 'Revenue MTD',      value: fmt(data.revenueMtd),             sub: 'This month' },
        { label: 'Orders MTD',       value: String(data.ordersMtd),            sub: `Today: ${data.ordersToday}` },
        { label: 'Avg Order Value',  value: fmt(data.avgOrderValue),           sub: 'All time' },
        { label: 'Quote Win Rate',   value: `${(data.quoteWinRate * 100).toFixed(0)}%`, sub: 'Accepted quotes' },
      ]
    : []

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange500} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.orange500} />
          </View>
        )}

        {!loading && !data && (
          <View style={styles.center}>
            <Text style={styles.empty}>Could not load analytics</Text>
            <TouchableOpacity onPress={() => { setLoading(true); void fetchData() }} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && data && (
          <>
            <View style={styles.kpiGrid}>
              {kpis.map((kpi) => (
                <View key={kpi.label} style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>{kpi.value}</Text>
                  <Text style={styles.kpiLabel}>{kpi.label}</Text>
                  <Text style={styles.kpiSub}>{kpi.sub}</Text>
                </View>
              ))}
            </View>

            {data.monthlyRevenue.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Monthly Revenue</Text>
                <View style={styles.chart}>
                  {data.monthlyRevenue.map((m) => {
                    const isCurrent = m.month === currentMo
                    const barH = Math.max(4, Math.round((m.revenue / maxRev) * 80))
                    return (
                      <View key={m.month} style={styles.barCol}>
                        <Text style={[styles.barVal, isCurrent && styles.barValActive]}>
                          {m.revenue >= 1000 ? `${(m.revenue / 1000).toFixed(0)}k` : String(m.revenue)}
                        </Text>
                        <View style={[styles.bar, { height: barH }, isCurrent && styles.barActive]} />
                        <Text style={[styles.barLabel, isCurrent && styles.barLabelActive]}>{m.month}</Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            )}

            {data.topParts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Parts</Text>
                {data.topParts.map((p, i) => (
                  <View key={p.name} style={[styles.partRow, i < data.topParts.length - 1 && styles.partRowBorder]}>
                    <View style={styles.partRank}>
                      <Text style={styles.partRankText}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.partName, { flex: 1 }]} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.partOrders}>{p.orderCount} orders</Text>
                    <Text style={styles.partRev}>{fmt(p.revenue, p.currency)}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:           { flex: 1, backgroundColor: c.navy900 },
    scroll:         { flex: 1 },
    header:         { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    title:          { fontSize: 20, fontWeight: '700', color: c.textPrimary },
    center:         { alignItems: 'center', paddingTop: 60, gap: 12 },
    empty:          { color: c.textSecondary, fontSize: 14 },
    retryBtn:       { backgroundColor: c.orange500, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
    retryText:      { color: c.navy900, fontWeight: '600', fontSize: 14 },
    kpiGrid:        { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
    kpiCard:        { flex: 1, minWidth: '45%', backgroundColor: c.navy800, borderRadius: 12, padding: 14, gap: 2 },
    kpiValue:       { fontSize: 18, fontWeight: '700', color: c.textPrimary },
    kpiLabel:       { fontSize: 12, color: c.orange500, fontWeight: '600' },
    kpiSub:         { fontSize: 11, color: c.textSecondary },
    section:        { marginHorizontal: 16, marginBottom: 16, backgroundColor: c.navy800, borderRadius: 12, padding: 16 },
    sectionTitle:   { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginBottom: 12 },
    chart:          { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 110 },
    barCol:         { flex: 1, alignItems: 'center', gap: 4 },
    barVal:         { fontSize: 9, color: c.textSecondary },
    barValActive:   { color: c.orange500, fontWeight: '700' },
    bar:            { width: '100%', backgroundColor: c.navy700, borderRadius: 3 },
    barActive:      { backgroundColor: c.orange500 },
    barLabel:       { fontSize: 10, color: c.textSecondary },
    barLabelActive: { color: c.orange500, fontWeight: '600' },
    partRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    partRowBorder:  { borderBottomWidth: 1, borderBottomColor: c.navy700 },
    partRank:       { width: 22, height: 22, borderRadius: 11, backgroundColor: c.navy700, alignItems: 'center', justifyContent: 'center' },
    partRankText:   { fontSize: 11, color: c.textSecondary, fontWeight: '600' },
    partName:       { fontSize: 13, color: c.textPrimary },
    partOrders:     { fontSize: 12, color: c.textSecondary },
    partRev:        { fontSize: 13, color: c.orange500, fontWeight: '600', minWidth: 70, textAlign: 'right' },
  })
}
