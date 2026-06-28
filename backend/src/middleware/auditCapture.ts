import type { Request, Response, NextFunction } from 'express'
import { publishEvent } from '../kafka/producer'
import { safeGetAuth } from '../lib/clerkConfig'
import { primaryRoleFromSessionClaims } from '../lib/sessionMetadata'

// Fires on res.finish — completely non-blocking, never delays the response.
// Publishes a structured audit event to Kafka for every handled request.
export function auditCapture(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()
  const requestId =
    (req.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID()

  // Echo request ID back so callers can correlate logs
  res.setHeader('x-request-id', requestId)

  res.on('finish', () => {
    // Skip non-API paths (health checks, static assets)
    if (!req.path.startsWith('/v1')) return

    const auth = safeGetAuth(req)
    const role = primaryRoleFromSessionClaims(
      auth?.sessionClaims as Record<string, unknown> | undefined,
    )

    const event = {
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor: {
        user_id: auth?.userId ?? null,
        role: role ?? null,
        organisation_id: auth?.orgId ?? null,
        session_id: auth?.sessionId ?? null,
      },
      action: {
        method: req.method,
        path: req.path,
        status_code: res.statusCode,
        outcome: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE',
      },
      request_id: requestId,
      latency_ms: Date.now() - start,
    }

    publishEvent('audit_events', event.actor.user_id ?? '', event).catch((err: unknown) => {
      // Fire-and-forget — log but never surface to client
      console.error('[auditCapture] Kafka publish failed:', err)
    })
  })

  next()
}
