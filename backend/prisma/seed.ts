/**
 * VelopX demo seed — idempotent data for E2E, smoke, and dashboard UI checks.
 *
 * Run: pnpm seed   (from repo root)
 *      or: cd backend && pnpm db:seed
 */
import {
  PrismaClient,
  type QuoteStatus,
  type OrderStatus,
  type DeliveryStatus,
} from '@prisma/client'
import {
  ALL_PLATFORM_USERS,
  DEALER_CATALOGUES,
  DEMO_PASSWORD,
  PRIMARY_ASSESSOR_EMAIL,
  PRIMARY_DEALER_EMAIL,
  SEED_CLAIMS,
  TEAM_USERS,
  type SeedUser,
} from './seed-accounts'

const prisma = new PrismaClient()

async function upsertPlatformUser(u: SeedUser) {
  const byEmail = await prisma.user.findUnique({ where: { email: u.email } })
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { name: u.name, role: u.role, email: u.email },
    })
  }
  return prisma.user.upsert({
    where: { clerkId: u.clerkId },
    create: u,
    update: { name: u.name, role: u.role, email: u.email },
  })
}

async function upsertUsers() {
  const users: Record<string, Awaited<ReturnType<typeof upsertPlatformUser>>> = {}
  for (const u of ALL_PLATFORM_USERS) {
    users[u.email] = await upsertPlatformUser(u)
  }
  return users
}

async function upsertParts(users: Record<string, { id: string; email: string }>) {
  const partsByOem: Record<string, { id: string; dealerId: string; price: number; currency: string }[]> = {}

  for (const [email, catalogue] of Object.entries(DEALER_CATALOGUES)) {
    const dealer = users[email]
    if (!dealer) continue

    for (const p of catalogue) {
      const existing = await prisma.part.findFirst({
        where: { dealerId: dealer.id, oemNumber: p.oemNumber },
      })

      const part = existing
        ? await prisma.part.update({
            where: { id: existing.id },
            data: {
              name: p.name,
              description: p.description ?? null,
              condition: p.condition,
              price: p.price,
              stockStatus: p.stockStatus,
              images: p.images ?? [],
            },
          })
        : await prisma.part.create({
            data: {
              ...p,
              dealerId: dealer.id,
              currency: 'GHS',
              country: 'GH',
              attributes: {},
              images: p.images ?? [],
            },
          })

      const key = p.oemNumber.toUpperCase()
      partsByOem[key] ??= []
      partsByOem[key].push({ id: part.id, dealerId: dealer.id, price: p.price, currency: 'GHS' })
    }
  }

  return partsByOem
}

function dealerParts(
  partsByOem: Record<string, { id: string; dealerId: string; price: number; currency: string }[]>,
  dealerId: string,
  oem: string
) {
  return partsByOem[oem.toUpperCase()]?.find((p) => p.dealerId === dealerId)
}

async function clearTransactionalSeed() {
  await prisma.auditEvent.deleteMany({ where: { claimReference: { in: SEED_CLAIMS } } })
  await prisma.delivery.deleteMany({
    where: { order: { claimReference: { in: SEED_CLAIMS } } },
  })
  await prisma.orderItem.deleteMany({
    where: { order: { claimReference: { in: SEED_CLAIMS } } },
  })
  await prisma.order.deleteMany({ where: { claimReference: { in: SEED_CLAIMS } } })
  await prisma.quoteItem.deleteMany({
    where: { quote: { claimReference: { in: SEED_CLAIMS } } },
  })
  await prisma.quote.deleteMany({ where: { claimReference: { in: SEED_CLAIMS } } })
}

async function seedQuotesAndOrders(
  users: Record<string, { id: string; email: string; name: string | null }>,
  partsByOem: Record<string, { id: string; dealerId: string; price: number; currency: string }[]>
) {
  const garage1 = users['garage@velopx.dev']
  const garage2 = users['garage2@velopx.dev']
  const garage3 = users['garage3@velopx.dev']
  const dealer =
    users[PRIMARY_DEALER_EMAIL] ?? users['dealer@velopx.dev']
  const assessor =
    users[PRIMARY_ASSESSOR_EMAIL] ?? users['assessor@velopx.dev']

  const brake = dealerParts(partsByOem, dealer.id, '53711-42200')!
  const headlight = dealerParts(partsByOem, dealer.id, '81170-02190')!
  const mirror = dealerParts(partsByOem, dealer.id, '87940-02190')!
  const bumperOther =
    partsByOem['52119-02901']?.find((p) => p.dealerId !== dealer.id) ??
    partsByOem['53711-42200']?.find((p) => p.dealerId !== dealer.id)!

  const vehicle = {
    make: 'Toyota',
    model: 'Corolla',
    year: 2019,
    vin: 'JTDBT923000123456',
    bodyType: 'sedan',
  }

  const pendingQuote = await prisma.quote.create({
    data: {
      requesterId: garage1.id,
      claimReference: 'CLM-2026-001',
      vehicleProfile: vehicle,
      status: 'pending' satisfies QuoteStatus,
      items: {
        create: [
          { partId: brake.id, price: brake.price, currency: brake.currency },
          { partId: mirror.id, price: mirror.price, currency: mirror.currency },
        ],
      },
    },
  })

  await prisma.quote.create({
    data: {
      requesterId: garage2.id,
      claimReference: 'CLM-2026-002',
      vehicleProfile: { ...vehicle, model: 'Camry', year: 2021 },
      status: 'responded' satisfies QuoteStatus,
      items: {
        create: [{ partId: headlight.id, price: headlight.price, currency: headlight.currency }],
      },
    },
  })

  await prisma.quote.create({
    data: {
      requesterId: garage1.id,
      claimReference: 'CLM-2026-003',
      vehicleProfile: vehicle,
      status: 'accepted' satisfies QuoteStatus,
      items: {
        create: [{ partId: brake.id, price: brake.price, currency: brake.currency }],
      },
    },
  })

  await prisma.quote.create({
    data: {
      requesterId: garage3.id,
      claimReference: 'CLM-2026-005',
      vehicleProfile: { make: 'Hyundai', model: 'Elantra', year: 2020 },
      status: 'pending' satisfies QuoteStatus,
      items: {
        create: [{ partId: bumperOther!.id, price: bumperOther!.price, currency: bumperOther!.currency }],
      },
    },
  })

  const orderConfirmed = await prisma.order.create({
    data: {
      buyerId: garage2.id,
      claimReference: 'CLM-2026-002',
      status: 'confirmed' satisfies OrderStatus,
      totalAmount: headlight.price,
      currency: 'GHS',
      items: {
        create: [{ partId: headlight.id, quantity: 1, price: headlight.price, currency: 'GHS' }],
      },
    },
  })

  const orderDispatched = await prisma.order.create({
    data: {
      buyerId: garage1.id,
      claimReference: 'CLM-2026-003',
      status: 'dispatched' satisfies OrderStatus,
      totalAmount: brake.price,
      currency: 'GHS',
      items: {
        create: [{ partId: brake.id, quantity: 1, price: brake.price, currency: 'GHS' }],
      },
    },
  })

  await prisma.order.create({
    data: {
      buyerId: garage1.id,
      claimReference: 'CLM-2026-001',
      status: 'pending' satisfies OrderStatus,
      totalAmount: Number(brake.price) + Number(mirror.price),
      currency: 'GHS',
      items: {
        create: [
          { partId: brake.id, quantity: 1, price: brake.price, currency: 'GHS' },
          { partId: mirror.id, quantity: 1, price: mirror.price, currency: 'GHS' },
        ],
      },
    },
  })

  await prisma.order.create({
    data: {
      buyerId: garage2.id,
      claimReference: 'CLM-2026-004',
      status: 'completed' satisfies OrderStatus,
      totalAmount: mirror.price,
      currency: 'GHS',
      items: {
        create: [{ partId: mirror.id, quantity: 1, price: mirror.price, currency: 'GHS' }],
      },
    },
  })

  await prisma.delivery.create({
    data: { orderId: orderConfirmed.id, status: 'pending' satisfies DeliveryStatus },
  })

  await prisma.delivery.create({
    data: {
      orderId: orderDispatched.id,
      status: 'in_transit' satisfies DeliveryStatus,
      collectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  })

  const completedOrder = await prisma.order.findFirst({ where: { claimReference: 'CLM-2026-004' } })
  if (completedOrder) {
    await prisma.delivery.create({
      data: {
        orderId: completedOrder.id,
        status: 'delivered' satisfies DeliveryStatus,
        collectedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    })
  }

  const auditBase = { country: 'GH', outcome: 'SUCCESS' }

  await prisma.auditEvent.createMany({
    data: [
      {
        ...auditBase,
        userId: garage1.id,
        role: 'garage_owner',
        actionType: 'quote.created',
        resource: 'quote',
        resourceId: pendingQuote.id,
        claimReference: 'CLM-2026-001',
        metadata: { items: 2 },
      },
      {
        ...auditBase,
        userId: dealer.id,
        role: 'dealer_owner',
        actionType: 'quote.viewed',
        resource: 'quote',
        resourceId: pendingQuote.id,
        claimReference: 'CLM-2026-001',
        latencyMs: 42,
      },
      {
        ...auditBase,
        userId: assessor.id,
        role: 'assessor',
        actionType: 'benchmark.checked',
        resource: 'part',
        claimReference: 'CLM-2026-001',
        metadata: { oem: '53711-42200', deviation: 4.2 },
      },
      {
        ...auditBase,
        userId: assessor.id,
        role: 'insurer_admin',
        actionType: 'claim.reviewed',
        resource: 'quote',
        claimReference: 'CLM-2026-002',
        metadata: { decision: 'approved', reviewer: PRIMARY_ASSESSOR_EMAIL },
      },
      {
        ...auditBase,
        userId: garage2.id,
        role: 'garage_owner',
        actionType: 'order.created',
        resource: 'order',
        resourceId: orderConfirmed.id,
        claimReference: 'CLM-2026-002',
      },
      {
        ...auditBase,
        userId: dealer.id,
        role: 'dealer_owner',
        actionType: 'order.confirmed',
        resource: 'order',
        resourceId: orderConfirmed.id,
        claimReference: 'CLM-2026-002',
      },
    ],
  })
}

async function printSummary(users: Record<string, { email: string }>) {
  const kayzParts = users[PRIMARY_DEALER_EMAIL]
    ? await prisma.part.count({ where: { dealerId: users[PRIMARY_DEALER_EMAIL].id } })
    : 0

  const [parts, quotes, orders, deliveries, audit] = await Promise.all([
    prisma.part.count(),
    prisma.quote.count(),
    prisma.order.count(),
    prisma.delivery.count(),
    prisma.auditEvent.count({ where: { claimReference: { in: SEED_CLAIMS } } }),
  ])

  console.log('\n── Seed summary ─────────────────────────────────────')
  console.log(`Parts: ${parts} total  |  ${PRIMARY_DEALER_EMAIL}: ${kayzParts} listings`)
  console.log(`Quotes: ${quotes}  |  Orders: ${orders}  |  Deliveries: ${deliveries}`)
  console.log(`Audit events (seed claims): ${audit}`)
  console.log('\n── Your accounts ────────────────────────────────────')
  console.log(`  ${PRIMARY_DEALER_EMAIL}`)
  console.log('    → /dealer — catalogue, RFQs, orders, dispatch')
  console.log(`  ${PRIMARY_ASSESSOR_EMAIL}`)
  console.log('    → /assess or /insight — marketplace, audit export CLM-2026-001')
  console.log('\n── Demo accounts (password for new: ' + DEMO_PASSWORD + ') ─')
  for (const u of TEAM_USERS) {
    console.log(`  ${u.email.padEnd(32)} ${u.role}${u.roles ? ' + ' + u.roles.join(', ') : ''}`)
  }
  console.log('──────────────────────────────────────────────────────\n')
}

async function main() {
  console.log('Seeding VelopX demo data…')

  const users = await upsertUsers()
  const userMap = Object.fromEntries(
    Object.values(users).map((u) => [u.email, u])
  ) as Record<string, { id: string; email: string; name: string | null }>

  const partsByOem = await upsertParts(userMap)

  console.log(`Primary dealer: ${PRIMARY_DEALER_EMAIL}`)
  console.log(`Primary assessor: ${PRIMARY_ASSESSOR_EMAIL}`)
  console.log('Refreshing transactional demo (quotes, orders, deliveries, audit)…')
  await clearTransactionalSeed()
  await seedQuotesAndOrders(userMap, partsByOem)

  await printSummary(userMap)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
