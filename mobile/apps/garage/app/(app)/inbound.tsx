import {useCallback, useEffect, useState, useMemo} from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useApi, useTheme, useThemedStyles, type ThemeColors} from '@velopx/shared'

// ── Types ──────────────────────────────────────────────────────────────────

type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'collected'
  | 'in_transit'
  | 'delivered'
  | 'confirmed'
  | 'disputed'
  | 'failed'

interface InboundDelivery {
  id: string
  status: DeliveryStatus
  estimatedMinutes: number | null
  distanceKm: number | null
  driver: { id: string; name: string | null; email: string } | null
  order: {
    id: string
    claimReference: string | null
    totalAmount: string
    currency: string
    items: Array<{ quantity: number; part: { name: string } }>
  }
  createdAt: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function deliveryStatusColors(colors: ThemeColors): Record<string, string> {
  return {
  pending:    colors.textMuted,
  assigned:   colors.info,
  collected:  colors.warning,
  in_transit: '#8B5CF6',
  delivered:  colors.success,
  confirmed:  colors.success,
  disputed:   colors.error,
  failed:     colors.error,
  }
}



const STATUS_LABEL: Record<string, string> = {
  pending:    'Pending',
  assigned:   'Assigned',
  collected:  'Collected',
  in_transit: 'In Transit',
  delivered:  'Delivered',
  confirmed:  'Confirmed',
  disputed:   'Disputed',
  failed:     'Failed',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function GarageInboundScreen() {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const STATUS_COLOR = useMemo(() => deliveryStatusColors(colors), [colors])
  const { apiFetch }  = useApi()
  const router        = useRouter()
  const [deliveries, setDeliveries] = useState<InboundDelivery[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const json = await apiFetch<{ data: InboundDelivery[] }>('/v1/deliveries?view=buyer&limit=50')
      setDeliveries(json.data ?? [])
    } catch { /* keep */ } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [apiFetch])

  useEffect(() => { void load() }, [load])

  const active = deliveries.filter(
    (d) => !['delivered', 'confirmed', 'failed'].includes(d.status),
  )
  const past = deliveries.filter((d) =>
    ['delivered', 'confirmed', 'failed'].includes(d.status),
  )

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbound Deliveries</Text>
        <Text style={styles.subtitle}>{deliveries.length} total</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.orange500} size="large" />
        </View>
      ) : (
        <FlatList
          data={[
            ...(active.length > 0
              ? [{ type: 'section', label: `Active (${active.length})`, id: '__active__' } as const]
              : []),
            ...active.map((d) => ({ type: 'item', ...d }) as const),
            ...(past.length > 0
              ? [{ type: 'section', label: `Past (${past.length})`, id: '__past__' } as const]
              : []),
            ...past.map((d) => ({ type: 'item', ...d }) as const),
          ]}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void load() }}
              tintColor={colors.orange500}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No inbound deliveries</Text>
              <Text style={styles.emptyHint}>
                Parts you order will appear here with live tracking.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === 'section') {
              return (
                <Text style={styles.sectionLabel}>{item.label}</Text>
              )
            }
            const d = item as InboundDelivery & { type: 'item' }
            const partNames = d.order.items
              .slice(0, 2)
              .map((i) => i.part.name)
              .join(', ')
            const moreCount = d.order.items.length - 2

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => router.push(`/(app)/inbound/${d.id}`)}
              >
                {/* Top row: ref + status */}
                <View style={styles.cardTop}>
                  <Text style={styles.ref} numberOfLines={1}>
                    {d.order.claimReference ?? d.order.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: STATUS_COLOR[d.status] + '25' }]}>
                    <Text style={[styles.badgeText, { color: STATUS_COLOR[d.status] }]}>
                      {STATUS_LABEL[d.status]}
                    </Text>
                  </View>
                </View>

                {/* Parts */}
                <Text style={styles.parts} numberOfLines={1}>
                  {partNames}
                  {moreCount > 0 ? ` +${moreCount} more` : ''}
                </Text>

                {/* Bottom row: ETA + driver + amount */}
                <View style={styles.cardBottom}>
                  <Text style={styles.meta}>
                    {d.status === 'in_transit' && d.estimatedMinutes != null
                      ? `ETA ${d.estimatedMinutes} min`
                      : formatDate(d.createdAt)}
                  </Text>
                  <Text style={styles.meta}>
                    {d.driver?.name ?? d.driver?.email ?? 'No driver'}
                  </Text>
                  <Text style={styles.amount}>
                    {d.order.currency} {Number(d.order.totalAmount).toLocaleString()}
                  </Text>
                </View>

                {/* Live indicator for in_transit */}
                {d.status === 'in_transit' && (
                  <View style={styles.liveRow}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Live tracking available — tap to view map</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: c.navy900,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: c.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: c.textSecondary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: c.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: c.navy800,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.navy700,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ref: {
    fontSize: 13,
    fontWeight: '700',
    color: c.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  parts: {
    fontSize: 12,
    color: c.textSecondary,
    marginBottom: 10,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    fontSize: 11,
    color: c.textMuted,
    flex: 1,
  },
  amount: {
    fontSize: 12,
    fontWeight: '700',
    color: c.orange500,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: c.navy700,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: c.success,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    color: c.success,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textSecondary,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: c.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
})
}
