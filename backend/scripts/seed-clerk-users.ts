/**
 * Provision Clerk test users for demo / E2E (idempotent by email).
 * Requires real CLERK_SECRET_KEY in .env — skips when placeholder keys.
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { clerkClient } from '@clerk/express'
import { DEMO_PASSWORD, SEED_USERS, TEAM_USERS, type SeedUser } from '../prisma/seed-accounts'

config({ path: resolve(__dirname, '../../.env') })

const ALL_USERS: SeedUser[] = [...SEED_USERS, ...TEAM_USERS]

function hasValidClerkKeys(): boolean {
  const pk = process.env.CLERK_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
  const sk = process.env.CLERK_SECRET_KEY ?? ''
  return (
    pk.startsWith('pk_') &&
    sk.startsWith('sk_') &&
    !pk.includes('xxxx') &&
    !sk.includes('xxxx')
  )
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/)
  return {
    firstName: parts[0] ?? full,
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
  }
}

async function upsertClerkUser(u: SeedUser) {
  const { firstName, lastName } = splitName(u.name)
  const existing = await clerkClient.users.getUserList({ emailAddress: [u.email], limit: 1 })
  const publicMetadata: Record<string, unknown> = { role: u.role }
  if (u.roles?.length) publicMetadata.roles = u.roles

  if (existing.data[0]) {
    await clerkClient.users.updateUser(existing.data[0].id, {
      firstName,
      lastName,
      publicMetadata,
    })
    return { email: u.email, action: 'updated' as const, clerkId: existing.data[0].id }
  }

  const created = await clerkClient.users.createUser({
    emailAddress: [u.email],
    password: DEMO_PASSWORD,
    firstName,
    lastName,
    publicMetadata,
    skipPasswordChecks: true,
  })

  return { email: u.email, action: 'created' as const, clerkId: created.id }
}

async function main() {
  if (!hasValidClerkKeys()) {
    console.log('Skipping Clerk seed — set real CLERK_SECRET_KEY in .env (not placeholder xxxx keys).')
    return
  }

  console.log('Provisioning Clerk demo users…')
  const results = []

  for (const u of ALL_USERS) {
    try {
      results.push(await upsertClerkUser(u))
      console.log(`  ${u.email} (${u.role})`)
    } catch (err) {
      console.error(`  FAIL ${u.email}:`, err instanceof Error ? err.message : err)
    }
  }

  const created = results.filter((r) => r.action === 'created').length
  const updated = results.filter((r) => r.action === 'updated').length

  console.log(`\nClerk seed done — ${created} created, ${updated} updated`)
  console.log(`Sign-in password for new accounts: ${DEMO_PASSWORD}`)
  console.log('Existing Clerk users keep their password; role metadata was synced.\n')
}

main().catch((err) => {
  console.error('Clerk seed failed:', err)
  process.exit(1)
})
