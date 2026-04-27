/**
 * Link your real Clerk user ID to the seeded dealer account.
 *
 * Usage:
 *   CLERK_ID=user_xxxxxxxxxxxx pnpm db:link-me
 *
 * or pass it as a positional arg:
 *   pnpm db:link-me user_xxxxxxxxxxxx
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const clerkId = process.env.CLERK_ID ?? process.argv[2]

  if (!clerkId || !clerkId.startsWith('user_')) {
    console.error('❌  Provide your Clerk user ID.\n')
    console.error('   CLERK_ID=user_xxxxxxxxxxxx pnpm db:link-me')
    console.error('   — or —')
    console.error('   pnpm db:link-me user_xxxxxxxxxxxx')
    process.exit(1)
  }

  const updated = await prisma.user.update({
    where: { clerkId: 'seed_dealer_001' },
    data: { clerkId },
  })

  console.log(`✅  Linked Clerk ID ${clerkId}`)
  console.log(`    DB user: ${updated.name} (${updated.email})`)
  console.log(`    Role: ${updated.role}`)
  console.log()
  console.log('   Sign in at http://localhost:3001 — the dealer dashboard will show seeded data.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
