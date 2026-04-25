import { kafka } from '../producer'
import { prisma } from '../../db/prisma'

const consumer = kafka.consumer({ groupId: 'velopx-audit-writer' })

export async function startAuditConsumer(): Promise<void> {
  await consumer.connect()
  await consumer.subscribe({ topic: 'audit_events', fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return

      try {
        const event = JSON.parse(message.value.toString()) as AuditEventMessage

        await prisma.auditEvent.create({
          data: {
            userId: event.actor.user_id ?? undefined,
            organisationId: event.actor.organisation_id ?? undefined,
            role: event.actor.role ?? undefined,
            actionType: `${event.action.method} ${event.action.path}`,
            outcome: event.action.outcome,
            sessionId: event.actor.session_id ?? undefined,
            requestId: event.request_id,
            latencyMs: event.latency_ms,
            metadata: event as unknown as Record<string, unknown>,
          },
        })
      } catch (err) {
        console.error('[auditConsumer] Failed to write audit event:', err)
        // Swallow — a failed audit write must never crash the consumer loop
      }
    },
  })

  console.log('✓ Audit consumer running')
}

interface AuditEventMessage {
  event_id: string
  timestamp: string
  actor: {
    user_id: string | null
    role: string | null
    organisation_id: string | null
    session_id: string | null
  }
  action: {
    method: string
    path: string
    status_code: number
    outcome: string
  }
  request_id: string
  latency_ms: number
}
