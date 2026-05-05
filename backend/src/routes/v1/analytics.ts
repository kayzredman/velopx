import { Router } from 'express'
import { requireClerkAuth, requireRole, getRequestAuth } from '../../middleware/clerkAuth'
import { prisma } from '../../db/prisma'
import { createHttpError } from '../../middleware/errorHandler'

const router = Router()

// ── Helpers ────────────────────────────────────────────────────────────────

function startOfMonth(): Date {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfDay(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// ── GET /v1/analytics/dealer — dealer revenue & sales metrics
router.get(
  '/dealer',
  requireClerkAuth,
  requireRole('dealer_owner', 'dealer_staff', 'platform_admin'),
  async (req, res, next) => {
    try {
      const auth = getRequestAuth(req)
      if (!auth.userId) return next(createHttpError(401, 'Unauthorized'))
      const user = await prisma.user.findUnique({ where: { clerkId: auth.userId } })
      if (!user) throw createHttpError(404, 'User not found')

      const mtdStart = startOfMonth()
      const todayStart = startOfDay()

      // Orders that include parts from this dealer
      const dealerOrdersWhere =
        user.role === 'platform_admin'
          ? {}
          : { items: { some: { part: { dealerId: user.id } } } }

      const [
        allOrders,
        mtdOrders,
        todayOrders,
        allQuotes,
        topParts,
      ] = await Promise.all([
        prisma.order.findMany({
          where: dealerOrdersWhere,
          select: { status: true, totalAmount: true, createdAt: true },
        }),
        prisma.order.findMany({
          where: { ...dealerOrdersWhere, createdAt: { gte: mtdStart } },
          select: { status: true, totalAmount: true },
        }),
        prisma.order.findMany({
          where: { ...dealerOrdersWhere, createdAt: { gte: todayStart } },
          select: { id: true },
        }),
        prisma.quoteItem.findMany({
          where:
            user.role === 'platform_admin'
              ? {}
              : { part: { dealerId: user.id } },
          include: { quote: { select: { status: true } } },
        }),
        prisma.orderItem.groupBy({
          by: ['partId'],
          where:
            user.role === 'platform_admin'
              ? {}
              : { part: { dealerId: user.id } },
          _count: { partId: true },
          _sum: { price: true },
          orderBy: { _count: { partId: 'desc' } },
          take: 5,
        }),
      ])

      // Revenue: sum of completed/delivered orders MTD
      const revenueMtd = mtdOrders
        .filter((o) => ['delivered', 'completed'].includes(o.status))
        .reduce((sum, o) => sum + Number(o.totalAmount), 0)

      // Revenue: all time
      const revenueAllTime = allOrders
        .filter((o) => ['delivered', 'completed'].includes(o.status))
        .reduce((sum, o) => sum + Number(o.totalAmount), 0)

      // Average order value
      const completedOrders = allOrders.filter((o) =>
        ['delivered', 'completed'].includes(o.status),
      )
      const avgOrderValue =
        completedOrders.length > 0
          ? revenueAllTime / completedOrders.length
          : 0

      // Quote win rate (accepted / total responded quotes)
      const totalQuoteItems = allQuotes.length
      const acceptedQuoteItems = allQuotes.filter(
        (qi) => qi.quote.status === 'accepted',
      ).length
      const quoteWinRate =
        totalQuoteItems > 0
          ? Math.round((acceptedQuoteItems / totalQuoteItems) * 100)
          : 0

      // Orders by status
      const ordersByStatus = allOrders.reduce<Record<string, number>>((acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1
        return acc
      }, {})

      // Enrich top parts with names
      const partIds = topParts.map((p) => p.partId)
      const partNames = await prisma.part.findMany({
        where: { id: { in: partIds } },
        select: { id: true, name: true, oemNumber: true, currency: true },
      })
      const partNameMap = Object.fromEntries(partNames.map((p) => [p.id, p]))

      const topPartsEnriched = topParts.map((p) => ({
        partId: p.partId,
        name: partNameMap[p.partId]?.name ?? 'Unknown',
        oemNumber: partNameMap[p.partId]?.oemNumber ?? null,
        currency: partNameMap[p.partId]?.currency ?? 'GHS',
        orderCount: p._count.partId,
        totalRevenue: Number(p._sum.price ?? 0),
      }))

      // Monthly revenue for last 6 months
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
      sixMonthsAgo.setDate(1)
      sixMonthsAgo.setHours(0, 0, 0, 0)

      const monthlyRevenueMap = allOrders
        .filter(
          (o) =>
            ['delivered', 'completed'].includes(o.status) &&
            new Date(o.createdAt) >= sixMonthsAgo,
        )
        .reduce<Record<string, number>>((acc, o) => {
          const key = new Date(o.createdAt).toISOString().slice(0, 7) // 'YYYY-MM'
          acc[key] = (acc[key] ?? 0) + Number(o.totalAmount)
          return acc
        }, {})

      // Build array with all 6 months (fill zeros for missing months)
      const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - (5 - i))
        const key = d.toISOString().slice(0, 7)
        const label = d.toLocaleString('default', { month: 'short' })
        return { month: label, revenue: monthlyRevenueMap[key] ?? 0 }
      })

      res.json({
        data: {
          revenueMtd,
          revenueAllTime,
          ordersMtd: mtdOrders.length,
          ordersToday: todayOrders.length,
          avgOrderValue: Math.round(avgOrderValue),
          quoteWinRate,
          ordersByStatus,
          topParts: topPartsEnriched,
          monthlyRevenue,
        },
      })
    } catch (err) {
      next(err)
    }
  },
)

// ── GET /v1/analytics/garage — garage dashboard KPIs
router.get(
  '/garage',
  requireClerkAuth,
  requireRole('garage_owner', 'garage_staff', 'platform_admin'),
  async (req, res, next) => {
    try {
      const auth = getRequestAuth(req)
      if (!auth.userId) return next(createHttpError(401, 'Unauthorized'))
      const user = await prisma.user.findUnique({ where: { clerkId: auth.userId } })
      if (!user) throw createHttpError(404, 'User not found')

      const buyerWhere =
        user.role === 'platform_admin' ? {} : { buyerId: user.id }

      const [openQuotes, orders, confirmedDeliveries, openJobCards] = await Promise.all([
        prisma.quote.count({
          where: { ...buyerWhere, status: 'pending' },
        }),
        prisma.order.findMany({
          where: buyerWhere,
          select: { status: true },
        }),
        prisma.delivery.count({
          where: {
            ...( user.role !== 'platform_admin' && { order: { buyerId: user.id } }),
            status: 'confirmed',
          },
        }),
        prisma.jobCard.count({
          where: {
            ...( user.role !== 'platform_admin' && { garageId: user.id }),
            status: { in: ['open', 'in_progress'] },
          },
        }),
      ])

      const activeOrders = orders.filter((o) =>
        ['pending', 'confirmed', 'dispatched'].includes(o.status),
      ).length
      const disputedOrders = orders.filter((o) => o.status === 'disputed').length

      res.json({
        data: {
          openRfqs: openQuotes,
          activeOrders,
          disputedOrders,
          partsReceived: confirmedDeliveries,
          openJobCards,
          totalOrders: orders.length,
          ordersByStatus: orders.reduce<Record<string, number>>((acc, o) => {
            acc[o.status] = (acc[o.status] ?? 0) + 1
            return acc
          }, {}),
        },
      })
    } catch (err) {
      next(err)
    }
  },
)

// ── GET /v1/analytics/platform — platform-wide intelligence (admin/insight)
router.get(
  '/platform',
  requireClerkAuth,
  requireRole('platform_admin', 'insurer_admin'),
  async (req, res, next) => {
    try {
      const [
        totalOrders,
        totalParts,
        totalUsers,
        totalDeliveries,
        revenueAgg,
        deliveriesByStatus,
        ordersByStatus,
      ] = await Promise.all([
        prisma.order.count(),
        prisma.part.count(),
        prisma.user.count(),
        prisma.delivery.count(),
        prisma.order.aggregate({
          where: { status: { in: ['delivered', 'completed'] } },
          _sum: { totalAmount: true },
        }),
        prisma.delivery.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        prisma.order.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ])

      // Anomaly detection: parts priced significantly above median for same OEM
      // Find OEM groups with multiple listings and flag outliers
      const oemGroups = await prisma.part.groupBy({
        by: ['oemNumber'],
        where: { oemNumber: { not: null } },
        _avg: { price: true },
        _count: { id: true },
        having: { id: { _count: { gt: 1 } } },
      })

      const anomalies: Array<{
        oemNumber: string
        partName: string
        price: number
        avgPrice: number
        dealerName: string | null
        overchargePercent: number
      }> = []

      for (const group of oemGroups.slice(0, 20)) {
        if (!group.oemNumber || group._avg.price === null) continue
        const avgPrice = Number(group._avg.price)
        const outlierThreshold = avgPrice * 1.5

        const outlierParts = await prisma.part.findMany({
          where: {
            oemNumber: group.oemNumber,
            price: { gt: outlierThreshold },
          },
          include: { dealer: { select: { name: true } } },
          take: 3,
        })

        for (const part of outlierParts) {
          anomalies.push({
            oemNumber: group.oemNumber,
            partName: part.name,
            price: Number(part.price),
            avgPrice,
            dealerName: part.dealer.name,
            overchargePercent: Math.round(((Number(part.price) - avgPrice) / avgPrice) * 100),
          })
        }
      }

      anomalies.sort((a, b) => b.overchargePercent - a.overchargePercent)

      res.json({
        data: {
          totalOrders,
          totalParts,
          totalUsers,
          totalDeliveries,
          totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
          deliveriesByStatus: deliveriesByStatus.reduce<Record<string, number>>((acc, d) => {
            acc[d.status] = d._count.id
            return acc
          }, {}),
          ordersByStatus: ordersByStatus.reduce<Record<string, number>>((acc, o) => {
            acc[o.status] = o._count.id
            return acc
          }, {}),
          anomalyCount: anomalies.length,
          anomalies: anomalies.slice(0, 10),
        },
      })
    } catch (err) {
      next(err)
    }
  },
)

// ── GET /v1/analytics/insurer — insurer-scoped KPIs
router.get(
  '/insurer',
  requireClerkAuth,
  requireRole('insurer_admin', 'insurer_staff', 'platform_admin'),
  async (req, res, next) => {
    try {
      const auth = getRequestAuth(req)
      if (!auth.userId) return next(createHttpError(401, 'Unauthorized'))
      const user = await prisma.user.findUnique({ where: { clerkId: auth.userId } })
      if (!user) throw createHttpError(404, 'User not found')

      const buyerWhere =
        user.role === 'platform_admin' ? {} : { buyerId: user.id }

      const deliveryBuyerWhere =
        user.role === 'platform_admin'
          ? {}
          : { order: { buyerId: user.id } }

      const [orders, deliveries, quotes] = await Promise.all([
        prisma.order.findMany({
          where: buyerWhere,
          select: { status: true, totalAmount: true, createdAt: true },
        }),
        prisma.delivery.findMany({
          where: deliveryBuyerWhere,
          select: { status: true },
        }),
        prisma.quoteItem.findMany({
          where: user.role === 'platform_admin' ? {} : { quote: { requesterId: user.id } },
          include: { quote: { select: { status: true } } },
        }),
      ])

      const totalRevenue = orders
        .filter((o) => ['delivered', 'completed'].includes(o.status))
        .reduce((sum, o) => sum + Number(o.totalAmount), 0)

      const ordersByStatus = orders.reduce<Record<string, number>>((acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1
        return acc
      }, {})

      const deliveriesByStatus = deliveries.reduce<Record<string, number>>((acc, d) => {
        acc[d.status] = (acc[d.status] ?? 0) + 1
        return acc
      }, {})

      const completionRate =
        deliveries.length > 0
          ? Math.round(((deliveriesByStatus['confirmed'] ?? 0) / deliveries.length) * 100)
          : 0

      const quoteAccepted = quotes.filter((q) => q.quote.status === 'accepted').length
      const quoteWinRate =
        quotes.length > 0 ? Math.round((quoteAccepted / quotes.length) * 100) : 0

      res.json({
        data: {
          totalClaims: orders.length,
          activeClaims: (ordersByStatus['pending'] ?? 0) + (ordersByStatus['confirmed'] ?? 0) + (ordersByStatus['dispatched'] ?? 0),
          disputedClaims: ordersByStatus['disputed'] ?? 0,
          completedClaims: (ordersByStatus['completed'] ?? 0) + (ordersByStatus['delivered'] ?? 0),
          totalRevenue,
          totalDeliveries: deliveries.length,
          deliveriesByStatus,
          completionRate,
          totalQuotes: quotes.length,
          quoteWinRate,
          ordersByStatus,
        },
      })
    } catch (err) {
      next(err)
    }
  },
)

export default router
