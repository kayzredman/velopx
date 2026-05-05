import { publishEvent as sendKafkaEvent } from './producer'

type EventPayload = Record<string, unknown>

/**
 * Fire-and-forget business event publisher.
 * All meaningful platform events flow through here → Kafka → consumers.
 * Never throws — a failed publish must never crash the calling request.
 */
export async function publishEvent(
  topic: string,
  key: string | null,
  payload: EventPayload,
): Promise<void> {
  sendKafkaEvent(topic, key ?? '', {
    ...payload,
    timestamp: new Date().toISOString(),
  }).catch((err: unknown) => {
    console.error(`[events] Failed to publish to ${topic}:`, err)
  })
}
