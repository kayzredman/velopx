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
import { Colors, useApi } from '@velopx/shared'

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
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange500} />}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Analytics</Text>
        </View>

        {loading && (
          <View style={s.center}>
            <ActivityIndicator color={Colors.orange500} />
          </View>
        )}

        {!loading && !data && (
          <View style={s.center}>
            <Text style={s.empty}>Could not load analytics</Text>
            <TouchableOpacity onPress={() => { setLoading(true); void fetchData() }} style={s.retryBtn}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && data && (
          <>
            {/* KPI cards */}
            <View style={s.kpiGrid}>
              {kpis.map((kpi) => (
                <View key={kpi.label} style={s.kpiCard}>
                  <Text style={s.kpiValue}>{kpi.value}</Text>
                  <Text style={s.kpiLabel}>{kpi.label}</Text>
                  <Text style={s.kpiSub}>{kpi.sub}</Text>
                </View>
              ))}
            </View>

            {/* Monthly revenue bar chart */}
            {data.monthlyRevenue.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Monthly Revenue</Text>
                <View style={s.chart}>
                  {data.monthlyRevenue.map((m) => {
                    const isCurrent = m.month === currentMo
                    const barH = Math.max(4, Math.round((m.revenue / maxRev) * 80))
                    return (
                      <View key={m.month} style={s.barCol}>
                        <Text style={[s.barVal, isCurrent && s.barValActive]}>
                          {m.revenue >= 1000 ? `${(m.revenue / 1000).toFixed(0)}k` : String(m.revenue)}
                        </Text>
                        <View style={[s.bar, { height: barH }, isCurrent && s.barActive]} />
                        <Text style={[s.barLabel, isCurrent && s.barLabelActive]}>{m.month}</Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            )}

            {/* Top parts */}
            {data.topParts.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Top Parts</Text>
                {data.topParts.map((p, i) => (
                  <View key={p.name} style={[s.partRow, i < data.topParts.length - 1 && s.partRowBorder]}>
                    <View style={s.partRank}>
                      <Text style={s.partRankText}>{i + 1}</Text>
                    </View>
                    <Text style={[s.partName, { flex: 1 }]} numberOfLines={1}>{p.name}</Text>
                    <Text style={s.partOrders}>{p.orderCount} orders</Text>
                    <Text style={s.partRev}>{fmt(p.revenue, p.currency)}</Text>
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

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.navy900 },
  scroll:         { flex: 1 },
  header:         { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title:          { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  center:         { alignItems: 'center', paddingTop: 60, gap: 12 },
  empty:          { color: Colors.textSecondary, fontSize: 14 },
  retryBtn:       { backgroundColor: Colors.orange500, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  retryText:      { color: Colors.navy900, fontWeight: '600', fontSize: 14 },
  kpiGrid:        { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  kpiCard:        { flex: 1, minWidth: '45%', backgroundColor: Colors.navy800, borderRadius: 12, padding: 14, gap: 2 },
  kpiValue:       { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  kpiLabel:       { fontSize: 12, color: Colors.orange500, fontWeight: '600' },
  kpiSub:         { fontSize: 11, color: Colors.textSecondary },
  section:        { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.navy800, borderRadius: 12, padding: 16 },
  sectionTitle:   { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
  chart:          { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 110 },
  barCol:         { flex: 1, alignItems: 'center', gap: 4 },
  barVal:         { fontSize: 9, color: Colors.textSecondary },
  barValActive:   { color: Colors.orange500, fontWeight: '700' },
  bar:            { width: '100%', backgroundColor: Colors.navy700, borderRadius: 3 },
  barActive:      { backgroundColor: Colors.orange500 },
  barLabel:       { fontSize: 10, color: Colors.textSecondary },
  barLabelActive: { color: Colors.orange500, fontWeight: '600' },
  partRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  partRowBorder:  { borderBottomWidth: 1, borderBottomColor: Colors.navy700 },
  partRank:       { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.navy700, alignItems: 'center', justifyContent: 'center' },
  partRankText:   { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  partName:       { fontSize: 13, color: Colors.textPrimary },
  partOrders:     { fontSize: 12, color: Colors.textSecondary },
  partRev:        { fontSize: 13, color: Colors.orange500, fontWeight: '600', minWidth: 70, textAlign: 'right' },
})
