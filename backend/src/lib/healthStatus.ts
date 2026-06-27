import { prisma } from '../db/prisma'
import { kafka } from '../kafka/producer'
import { hasValidClerkKeys } from './clerkConfig'
import { API_ENDPOINTS, WEB_ROUTES } from './apiCatalog'

export interface HealthReport {
  status: 'ok' | 'degraded' | 'error'
  ts: string
  version: string
  checks: {
    api: 'ok'
    database: 'ok' | 'error'
    kafka: 'ok' | 'error' | 'skipped'
    clerk: 'configured' | 'placeholder'
  }
  counts: {
    apiEndpoints: number
    webRoutes: number
  }
}

export async function getHealthReport(): Promise<HealthReport> {
  let database: 'ok' | 'error' = 'error'
  try {
    await prisma.$queryRaw`SELECT 1`
    database = 'ok'
  } catch {
    database = 'error'
  }

  let kafkaStatus: 'ok' | 'error' | 'skipped' = 'skipped'
  if (process.env.KAFKA_BROKERS) {
    try {
      const admin = kafka.admin()
      await admin.connect()
      await admin.listTopics()
      await admin.disconnect()
      kafkaStatus = 'ok'
    } catch {
      kafkaStatus = 'error'
    }
  }

  const checks = {
    api: 'ok' as const,
    database,
    kafka: kafkaStatus,
    clerk: hasValidClerkKeys() ? ('configured' as const) : ('placeholder' as const),
  }

  const status =
    database === 'error' ? 'error' : kafkaStatus === 'error' ? 'degraded' : 'ok'

  return {
    status,
    ts: new Date().toISOString(),
    version: '0.0.1',
    checks,
    counts: {
      apiEndpoints: API_ENDPOINTS.length,
      webRoutes: WEB_ROUTES.length,
    },
  }
}
