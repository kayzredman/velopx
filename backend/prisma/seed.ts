/**
 * VelopX dev seed — run with: pnpm seed
 *
 * Creates:
 *  - 1 dealer org + 1 dealer user  (clerkId: "seed_dealer_001")
 *  - 1 garage org + 1 garage user  (clerkId: "seed_garage_001")
 *  - 12 parts across OEM / aftermarket / used
 *  - 3 quotes (pending / responded / accepted)
 *  - 4 orders (pending / confirmed / dispatched / delivered)
 *  - 2 deliveries
 */

import { PrismaClient, PartCondition, StockStatus, QuoteStatus, OrderStatus, DeliveryStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱  Seeding VelopX dev database…')

  // ── Orgs ──────────────────────────────────────────────────────────────────

  const dealerOrg = await prisma.organisation.upsert({
    where: { clerkOrgId: 'seed_org_dealer' },
    update: {},
    create: {
      clerkOrgId: 'seed_org_dealer',
      name: 'Accra Auto Parts Ltd',
      type: 'dealer',
      country: 'GH',
    },
  })

  const garageOrg = await prisma.organisation.upsert({
    where: { clerkOrgId: 'seed_org_garage' },
    update: {},
    create: {
      clerkOrgId: 'seed_org_garage',
      name: 'Tema Motors & Repairs',
      type: 'garage',
      country: 'GH',
    },
  })

  // ── Users ─────────────────────────────────────────────────────────────────

  const dealer = await prisma.user.upsert({
    where: { clerkId: 'seed_dealer_001' },
    update: {},
    create: {
      clerkId: 'seed_dealer_001',
      email: 'kwame@accrautoparts.gh',
      name: 'Kwame Mensah',
      role: 'dealer_owner',
      organisationId: dealerOrg.id,
    },
  })

  const garage = await prisma.user.upsert({
    where: { clerkId: 'seed_garage_001' },
    update: {},
    create: {
      clerkId: 'seed_garage_001',
      email: 'kofi@temamotors.gh',
      name: 'Kofi Asante',
      role: 'garage_owner',
      organisationId: garageOrg.id,
    },
  })

  // ── Parts ─────────────────────────────────────────────────────────────────

  const partsData = [
    {
      name: 'Front Brake Pad Set — Toyota Camry 2018-2022',
      description: 'OEM-spec ceramic front brake pads for Camry XV70. Low dust, long life.',
      oemNumber: '04465-33471',
      condition: PartCondition.oem,
      price: 320.00,
      stockStatus: StockStatus.in_stock,
      attributes: { brand: 'Toyota Genuine', vehicleMake: 'Toyota', vehicleModel: 'Camry', yearFrom: 2018, yearTo: 2022, position: 'front' },
    },
    {
      name: 'Alternator — Honda CR-V 2017-2021',
      description: 'Remanufactured alternator, 12V 150A. Tested to OEM spec.',
      oemNumber: '31100-5PA-A01',
      condition: PartCondition.aftermarket,
      price: 850.00,
      stockStatus: StockStatus.in_stock,
      attributes: { brand: 'Denso', vehicleMake: 'Honda', vehicleModel: 'CR-V', yearFrom: 2017, yearTo: 2021 },
    },
    {
      name: 'Radiator — Toyota Hilux 2016-2023',
      description: 'Aluminium core radiator. Direct OEM replacement.',
      oemNumber: '16400-0L160',
      condition: PartCondition.oem,
      price: 1250.00,
      stockStatus: StockStatus.in_stock,
      attributes: { brand: 'Toyota Genuine', vehicleMake: 'Toyota', vehicleModel: 'Hilux', yearFrom: 2016, yearTo: 2023 },
    },
    {
      name: 'Starter Motor — Mitsubishi Pajero Sport 2016',
      description: 'Used starter motor, good condition. Tested and working.',
      oemNumber: 'M000T87481',
      condition: PartCondition.used,
      price: 280.00,
      stockStatus: StockStatus.limited,
      attributes: { vehicleMake: 'Mitsubishi', vehicleModel: 'Pajero Sport', yearFrom: 2015, yearTo: 2017, mileage: '78000km' },
    },
    {
      name: 'Headlight Assembly LHS — Hyundai Tucson 2019',
      description: 'Aftermarket LED headlight assembly, left-hand side. Plug-and-play.',
      oemNumber: '92101-D3050',
      condition: PartCondition.aftermarket,
      price: 760.00,
      stockStatus: StockStatus.in_stock,
      attributes: { brand: 'TYC', vehicleMake: 'Hyundai', vehicleModel: 'Tucson', yearFrom: 2018, yearTo: 2021, side: 'left' },
    },
    {
      name: 'Rear Shock Absorber Pair — Kia Sorento 2020',
      description: 'OEM Kia rear shocks, sold as a pair. New old stock.',
      oemNumber: '55310-C6100',
      condition: PartCondition.oem,
      price: 1100.00,
      stockStatus: StockStatus.limited,
      attributes: { brand: 'KYB', vehicleMake: 'Kia', vehicleModel: 'Sorento', yearFrom: 2020, yearTo: 2023, axle: 'rear', qty: 2 },
    },
    {
      name: 'Engine Air Filter — Toyota Corolla 2014-2019',
      description: 'High-flow aftermarket air filter. Washable and reusable.',
      oemNumber: '17801-0T010',
      condition: PartCondition.aftermarket,
      price: 85.00,
      stockStatus: StockStatus.in_stock,
      attributes: { brand: 'K&N', vehicleMake: 'Toyota', vehicleModel: 'Corolla', yearFrom: 2014, yearTo: 2019 },
    },
    {
      name: 'Timing Belt Kit — Honda Accord 2013-2017',
      description: 'Complete timing belt kit with water pump and tensioner.',
      oemNumber: '14400-R70-A01',
      condition: PartCondition.aftermarket,
      price: 420.00,
      stockStatus: StockStatus.in_stock,
      attributes: { brand: 'Gates', vehicleMake: 'Honda', vehicleModel: 'Accord', yearFrom: 2013, yearTo: 2017 },
    },
    {
      name: 'Gearbox — Toyota Land Cruiser 200 Series (Used)',
      description: 'Used automatic gearbox, 120k km. Complete unit with warranty.',
      oemNumber: '35000-60C10',
      condition: PartCondition.used,
      price: 4800.00,
      stockStatus: StockStatus.limited,
      attributes: { vehicleMake: 'Toyota', vehicleModel: 'Land Cruiser', series: '200 Series', yearFrom: 2012, yearTo: 2015, mileage: '120000km', warrantyMonths: 3 },
    },
    {
      name: 'CV Axle Shaft LHS — Nissan X-Trail 2016-2020',
      description: 'Aftermarket CV axle with boot. Ready to install.',
      oemNumber: '39101-4CB0A',
      condition: PartCondition.aftermarket,
      price: 380.00,
      stockStatus: StockStatus.in_stock,
      attributes: { brand: 'GSP', vehicleMake: 'Nissan', vehicleModel: 'X-Trail', yearFrom: 2016, yearTo: 2020, side: 'left' },
    },
    {
      name: 'Fuel Injector Set (4) — Volkswagen Golf 1.4 TSI',
      description: 'OEM Bosch injectors, set of 4. Factory reconditioned.',
      oemNumber: '03C906031',
      condition: PartCondition.oem,
      price: 1600.00,
      stockStatus: StockStatus.in_stock,
      attributes: { brand: 'Bosch', vehicleMake: 'Volkswagen', vehicleModel: 'Golf', engine: '1.4 TSI', yearFrom: 2013, yearTo: 2019, qty: 4 },
    },
    {
      name: 'Power Steering Rack — Ford Ranger 2012-2016 (Used)',
      description: 'Used power steering rack. Removed from 65k km vehicle.',
      oemNumber: 'EB3C3504EA',
      condition: PartCondition.used,
      price: 620.00,
      stockStatus: StockStatus.out_of_stock,
      attributes: { vehicleMake: 'Ford', vehicleModel: 'Ranger', yearFrom: 2012, yearTo: 2016, mileage: '65000km' },
    },
  ]

  const parts: { id: string }[] = []
  for (const p of partsData) {
    const part = await prisma.part.create({
      data: {
        dealerId: dealer.id,
        name: p.name,
        description: p.description,
        oemNumber: p.oemNumber,
        condition: p.condition,
        price: p.price,
        currency: 'GHS',
        country: 'GH',
        stockStatus: p.stockStatus,
        attributes: p.attributes,
        images: [],
      },
    })
    parts.push(part)
  }

  console.log(`  ✓ Created ${parts.length} parts`)

  // ── Quotes ────────────────────────────────────────────────────────────────

  const quote1 = await prisma.quote.create({
    data: {
      requesterId: garage.id,
      claimReference: 'CLM-2026-00441',
      vehicleProfile: { make: 'Toyota', model: 'Camry', year: 2020, vin: 'JTDBE32K123456789', engine: '2.5L 4cyl', bodyType: 'Sedan' },
      status: QuoteStatus.pending,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      items: {
        create: [
          { partId: parts[0].id, price: 320.00, currency: 'GHS', note: 'Urgent — vehicle off road' },
          { partId: parts[6].id, price: 85.00, currency: 'GHS' },
        ],
      },
    },
  })

  const quote2 = await prisma.quote.create({
    data: {
      requesterId: garage.id,
      claimReference: 'CLM-2026-00389',
      vehicleProfile: { make: 'Honda', model: 'CR-V', year: 2019, vin: 'JHMRD78413S000442', engine: '1.5L Turbo', bodyType: 'SUV' },
      status: QuoteStatus.responded,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      items: {
        create: [
          { partId: parts[1].id, price: 850.00, currency: 'GHS', note: 'Alternator failure confirmed by assessor' },
        ],
      },
    },
  })

  const quote3 = await prisma.quote.create({
    data: {
      requesterId: garage.id,
      vehicleProfile: { make: 'Toyota', model: 'Hilux', year: 2018, engine: '2.4L Diesel', bodyType: 'Pickup' },
      status: QuoteStatus.accepted,
      items: {
        create: [
          { partId: parts[2].id, price: 1250.00, currency: 'GHS' },
          { partId: parts[4].id, price: 760.00, currency: 'GHS', note: 'LHS headlight — accident damage' },
        ],
      },
    },
  })

  console.log(`  ✓ Created 3 quotes (pending / responded / accepted)`)

  // ── Orders ────────────────────────────────────────────────────────────────

  const order1 = await prisma.order.create({
    data: {
      buyerId: garage.id,
      claimReference: 'CLM-2026-00389',
      status: OrderStatus.pending,
      totalAmount: 850.00,
      currency: 'GHS',
      items: {
        create: [{ partId: parts[1].id, quantity: 1, price: 850.00, currency: 'GHS' }],
      },
    },
  })

  const order2 = await prisma.order.create({
    data: {
      buyerId: garage.id,
      status: OrderStatus.confirmed,
      totalAmount: 505.00,
      currency: 'GHS',
      items: {
        create: [
          { partId: parts[0].id, quantity: 1, price: 320.00, currency: 'GHS' },
          { partId: parts[7].id, quantity: 1, price: 185.00, currency: 'GHS' },
        ],
      },
    },
  })

  const order3 = await prisma.order.create({
    data: {
      buyerId: garage.id,
      claimReference: 'CLM-2026-00441',
      status: OrderStatus.dispatched,
      totalAmount: 2010.00,
      currency: 'GHS',
      items: {
        create: [
          { partId: parts[2].id, quantity: 1, price: 1250.00, currency: 'GHS' },
          { partId: parts[4].id, quantity: 1, price: 760.00, currency: 'GHS' },
        ],
      },
    },
  })

  const order4 = await prisma.order.create({
    data: {
      buyerId: garage.id,
      status: OrderStatus.delivered,
      totalAmount: 380.00,
      currency: 'GHS',
      items: {
        create: [{ partId: parts[9].id, quantity: 1, price: 380.00, currency: 'GHS' }],
      },
    },
  })

  console.log(`  ✓ Created 4 orders (pending / confirmed / dispatched / delivered)`)

  // ── Deliveries ────────────────────────────────────────────────────────────

  await prisma.delivery.create({
    data: {
      orderId: order3.id,
      status: DeliveryStatus.in_transit,
      note: 'Call buyer on arrival',
    },
  })

  await prisma.delivery.create({
    data: {
      orderId: order4.id,
      status: DeliveryStatus.delivered,
      proofUrl: 'https://placehold.co/400x300?text=POD',
      deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  })

  console.log(`  ✓ Created 2 deliveries`)
  console.log('')
  console.log('✅  Seed complete.')
  console.log('')
  console.log('  Dealer user  → clerkId: seed_dealer_001  (log in with a Clerk account mapped to this)')
  console.log('  Garage user  → clerkId: seed_garage_001')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
