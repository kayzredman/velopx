/**
 * Sync team accounts to Postgres (by email — preserves real Clerk IDs on sign-in).
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import { TEAM_USERS } from '../prisma/seed-accounts'

config({ path: resolve(__dirname, '../../.env') })

const prisma = new PrismaClient()

async function upsertTeamUser(u: (typeof TEAM_USERS)[number]) {
  const existing = await prisma.user.findUnique({ where: { email: u.email } })
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { name: u.name, role: u.role },
    })
  }
  return prisma.user.create({
    data: {
      clerkId: u.clerkId,
      email: u.email,
      name: u.name,
      role: u.role,
    },
  })
}

async function main() {
  console.log('Syncing team users to database…')
  for (const u of TEAM_USERS) {
    const row = await upsertTeamUser(u)
    const extra = u.roles?.length ? ` + roles [${u.roles.join(', ')}] in Clerk` : ''
    console.log(`  ${u.email} → ${u.role}${extra} (id: ${row.id})`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
