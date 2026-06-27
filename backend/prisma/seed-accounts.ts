import type { PartCondition, StockStatus, UserRole } from '@prisma/client'

export const DEMO_PASSWORD = 'VelopXDemo2026!'

export const SEED_CLAIMS = [
  'CLM-2026-001',
  'CLM-2026-002',
  'CLM-2026-003',
  'CLM-2026-004',
  'CLM-2026-005',
]

export interface SeedUser {
  clerkId: string
  email: string
  name: string
  role: UserRole
  /** Extra JWT roles (e.g. assessor + insurer on one account) */
  roles?: UserRole[]
}

export const SEED_USERS: SeedUser[] = [
  { clerkId: 'dev_dealer_smoke', email: 'dealer@velopx.dev', name: 'Accra Auto Parts', role: 'dealer_owner' },
  { clerkId: 'dev_dealer_staff', email: 'dealer-staff@velopx.dev', name: 'Kofi Mensah', role: 'dealer_staff' },
  { clerkId: 'dev_dealer_kumasi', email: 'dealer2@velopx.dev', name: 'Kumasi Motor Spares', role: 'dealer_owner' },
  { clerkId: 'dev_dealer_tema', email: 'dealer3@velopx.dev', name: 'Tema Parts Hub', role: 'dealer_owner' },
  { clerkId: 'dev_garage_accra', email: 'garage@velopx.dev', name: 'Elite Body Works', role: 'garage_owner' },
  { clerkId: 'dev_garage_east', email: 'garage2@velopx.dev', name: 'East Legon Motors', role: 'garage_owner' },
  { clerkId: 'dev_garage_takoradi', email: 'garage3@velopx.dev', name: 'Harbour City Garage', role: 'garage_owner' },
  { clerkId: 'dev_garage_staff', email: 'garage-staff@velopx.dev', name: 'Ama Boateng', role: 'garage_staff' },
  { clerkId: 'dev_assessor', email: 'assessor@velopx.dev', name: 'Yaw Asante', role: 'assessor' },
  { clerkId: 'dev_insurer', email: 'insurer@velopx.dev', name: 'Star Assurance Ghana', role: 'insurer_admin' },
  { clerkId: 'dev_insurer_staff', email: 'insurer-staff@velopx.dev', name: 'Nana Osei', role: 'insurer_staff' },
  { clerkId: 'dev_driver', email: 'driver@velopx.dev', name: 'Kwame Driver', role: 'driver' },
]

/** Real team accounts — synced to Clerk + DB via pnpm seed:team */
export const TEAM_USERS: SeedUser[] = [
  {
    clerkId: 'team_kayz_dealer',
    email: 'kayzredman@gmail.com',
    name: 'Kayz Redman',
    role: 'dealer_owner',
  },
  {
    clerkId: 'team_rowland',
    email: 'rowland.kay.jones@gmail.com',
    name: 'Rowland Kay Jones',
    role: 'insurer_admin',
    roles: ['assessor', 'insurer_admin'],
  },
]

export const ALL_PLATFORM_USERS: SeedUser[] = [...SEED_USERS, ...TEAM_USERS]

/** Primary accounts for seeded transactional demo data */
export const PRIMARY_DEALER_EMAIL = 'kayzredman@gmail.com'
export const PRIMARY_ASSESSOR_EMAIL = 'rowland.kay.jones@gmail.com'

export interface PartSeed {
  name: string
  oemNumber: string
  condition: PartCondition
  price: number
  stockStatus: StockStatus
  description?: string
  images?: string[]
}

/** Stock photos for demo listings (picsum — stable for local/dev seed) */
const stock = (key: string) => `https://picsum.photos/seed/velopx-${key}/800/600`

const STOCK = {
  brake: stock('brake'),
  headlight: stock('headlight'),
  mirror: stock('mirror'),
  bumper: stock('bumper'),
  radiator: stock('radiator'),
  alternator: stock('alternator'),
  windscreen: stock('windscreen'),
  tail: stock('tail'),
  shock: stock('shock'),
  ac: stock('ac'),
  fuel: stock('fuel'),
  handle: stock('handle'),
  cat: stock('cat'),
} as const

/** Shared starter catalogue — used for primary dealer + demo dealer */
const KAYZ_DEALER_CATALOGUE: PartSeed[] = [
  { name: 'Brake Disc Rotor', oemNumber: '53711-42200', condition: 'oem', price: 850, stockStatus: 'in_stock', description: 'Kayz Auto Parts — Accra', images: [STOCK.brake] },
  { name: 'LED Headlight Assembly', oemNumber: '81170-02190', condition: 'used', price: 4200, stockStatus: 'in_stock', images: [STOCK.headlight] },
  { name: 'Side Mirror Unit', oemNumber: '87940-02190', condition: 'aftermarket', price: 1150, stockStatus: 'in_stock', images: [STOCK.mirror] },
  { name: 'Front Bumper Cover', oemNumber: '52119-02901', condition: 'oem', price: 6800, stockStatus: 'limited', images: [STOCK.bumper] },
  { name: 'Radiator Assembly', oemNumber: '16400-0C010', condition: 'oem', price: 2400, stockStatus: 'in_stock', images: [STOCK.radiator] },
  { name: 'Alternator 120A', oemNumber: '27060-0C020', condition: 'aftermarket', price: 1950, stockStatus: 'in_stock', images: [STOCK.alternator] },
  { name: 'Windscreen (Laminated)', oemNumber: '56111-0D010', condition: 'oem', price: 8900, stockStatus: 'out_of_stock', images: [STOCK.windscreen] },
]

export const DEALER_CATALOGUES: Record<string, PartSeed[]> = {
  [PRIMARY_DEALER_EMAIL]: KAYZ_DEALER_CATALOGUE,
  'dealer@velopx.dev': KAYZ_DEALER_CATALOGUE.map((p) => ({ ...p, description: 'Demo dealer mirror' })),
  'dealer2@velopx.dev': [
    { name: 'Brake Disc Rotor', oemNumber: '53711-42200', condition: 'oem', price: 920, stockStatus: 'in_stock', description: 'Kumasi warehouse stock', images: [STOCK.brake] },
    { name: 'LED Headlight Assembly', oemNumber: '81170-02190', condition: 'aftermarket', price: 3800, stockStatus: 'in_stock', images: [STOCK.headlight] },
    { name: 'Side Mirror Unit', oemNumber: '87940-02190', condition: 'oem', price: 1450, stockStatus: 'in_stock', images: [STOCK.mirror] },
    { name: 'Rear Tail Lamp', oemNumber: '81551-02190', condition: 'used', price: 980, stockStatus: 'limited', images: [STOCK.tail] },
    { name: 'Shock Absorber (Front)', oemNumber: '48510-09G50', condition: 'aftermarket', price: 720, stockStatus: 'in_stock', images: [STOCK.shock] },
    { name: 'AC Compressor', oemNumber: '88320-0Y010', condition: 'oem', price: 5200, stockStatus: 'in_stock', images: [STOCK.ac] },
  ],
  'dealer3@velopx.dev': [
    { name: 'Brake Disc Rotor', oemNumber: '53711-42200', condition: 'aftermarket', price: 650, stockStatus: 'in_stock', images: [STOCK.brake] },
    { name: 'Front Bumper Cover', oemNumber: '52119-02901', condition: 'aftermarket', price: 4200, stockStatus: 'in_stock', images: [STOCK.bumper] },
    { name: 'Radiator Assembly', oemNumber: '16400-0C010', condition: 'used', price: 1600, stockStatus: 'in_stock', images: [STOCK.radiator] },
    { name: 'Fuel Pump Module', oemNumber: '77020-0C010', condition: 'oem', price: 3100, stockStatus: 'in_stock', images: [STOCK.fuel] },
    { name: 'Door Handle (Exterior)', oemNumber: '69210-0C010', condition: 'used', price: 280, stockStatus: 'in_stock', images: [STOCK.handle] },
    { name: 'Catalytic Converter', oemNumber: '17410-0C010', condition: 'oem', price: 12500, stockStatus: 'limited', images: [STOCK.cat] },
  ],
}
