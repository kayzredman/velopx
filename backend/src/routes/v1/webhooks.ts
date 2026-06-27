import { Router } from 'express'
import { Webhook } from 'svix'
import { prisma } from '../../db/prisma'
import type { UserRole } from '../../types'

const router = Router()

// Raw body required for Svix signature verification
router.post(
  '/clerk',
  async (req, res) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('[webhook] CLERK_WEBHOOK_SECRET not set')
      res.status(500).json({ error: 'Webhook secret not configured' })
      return
    }

    const rawBody =
      req.body instanceof Buffer
        ? req.body.toString('utf8')
        : typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body)

    const svixHeaders = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    }

    if (!svixHeaders['svix-id'] || !svixHeaders['svix-timestamp'] || !svixHeaders['svix-signature']) {
      res.status(400).json({ error: 'Missing Svix headers' })
      return
    }

    let event: ClerkWebhookEvent
    try {
      const wh = new Webhook(webhookSecret)
      event = wh.verify(rawBody, svixHeaders) as ClerkWebhookEvent
    } catch (err) {
      console.error('[webhook] Signature verification failed:', err)
      res.status(400).json({ error: 'Invalid webhook signature' })
      return
    }

    try {
      await handleClerkEvent(event)
      res.json({ received: true })
    } catch (err) {
      console.error('[webhook] Handler failed:', err)
      res.status(500).json({ error: 'Webhook handler failed' })
    }
  }
)

async function handleClerkEvent(event: ClerkWebhookEvent): Promise<void> {
  switch (event.type) {
    case 'user.created': {
      const { id, email_addresses, first_name, last_name, public_metadata, unsafe_metadata } = event.data
      const primaryEmail = email_addresses.find((e) => e.id === event.data.primary_email_address_id)

      await prisma.user.upsert({
        where: { clerkId: id },
        create: {
          clerkId: id,
          email: primaryEmail?.email_address ?? '',
          name: [first_name, last_name].filter(Boolean).join(' ') || undefined,
          role: ((unsafe_metadata?.role ?? public_metadata?.role) as UserRole) ?? 'driver',
        },
        update: {
          email: primaryEmail?.email_address ?? undefined,
          name: [first_name, last_name].filter(Boolean).join(' ') || undefined,
        },
      })
      break
    }

    case 'user.updated': {
      const { id, email_addresses, first_name, last_name, public_metadata } = event.data
      const primaryEmail = email_addresses.find((e) => e.id === event.data.primary_email_address_id)

      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email: primaryEmail?.email_address ?? undefined,
          name: [first_name, last_name].filter(Boolean).join(' ') || undefined,
          role: (public_metadata?.role as UserRole) ?? undefined,
        },
      })
      break
    }

    case 'user.deleted': {
      if (event.data.id) {
        await prisma.user.delete({ where: { clerkId: event.data.id } }).catch(() => {
          // May not exist if webhook fired before user.created was processed
        })
      }
      break
    }

    default:
      // Silently ignore unhandled event types
      break
  }
}

// ── Clerk webhook event types (minimal)
interface ClerkWebhookEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | string
  data: {
    id: string
    email_addresses: Array<{ id: string; email_address: string }>
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
    public_metadata: Record<string, unknown>
    unsafe_metadata: Record<string, unknown>
  }
}

export default router
