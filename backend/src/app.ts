import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { clerkMiddleware } from '@clerk/express'
import { auditCapture } from './middleware/auditCapture'
import { errorHandler } from './middleware/errorHandler'
import v1Router from './routes/v1'
import { prisma } from './db/prisma'
import { isKafkaConnected } from './kafka/producer'
import Redis from 'ioredis'

const app = express()

// ── Security headers
app.use(helmet())

// ── CORS — lock down to known origins in production
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? '*',
    credentials: true,
  })
)

// ── Body parsing
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Clerk JWT middleware — enriches req with auth context on every request
app.use(clerkMiddleware())

// ── Audit capture — fires on res.finish, publishes to Kafka (never blocks)
app.use(auditCapture)

// ── Routes
app.use('/v1', v1Router)

// ── Health — deep check of all services
app.get('/health', async (_req, res) => {
  const start = Date.now()

  const check = async (fn: () => Promise<void>): Promise<{ status: 'up' | 'down'; latencyMs: number; error?: string }> => {
    const t = Date.now()
    try {
      await fn()
      return { status: 'up', latencyMs: Date.now() - t }
    } catch (err) {
      return { status: 'down', latencyMs: Date.now() - t, error: (err as Error).message }
    }
  }

  const [database, cache, kafka] = await Promise.all([
    check(async () => { await prisma.$queryRaw`SELECT 1` }),
    check(async () => {
      const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', { lazyConnect: true, connectTimeout: 3000 })
      await redis.connect()
      await redis.ping()
      await redis.quit()
    }),
    check(async () => {
      if (!isKafkaConnected()) throw new Error('Producer not connected')
    }),
  ])

  const allUp = [database, cache, kafka].every(s => s.status === 'up')
  const anyDown = [database, cache, kafka].some(s => s.status === 'down')

  res.status(allUp ? 200 : 503).json({
    status: allUp ? 'operational' : anyDown ? 'degraded' : 'operational',
    totalLatencyMs: Date.now() - start,
    timestamp: new Date().toISOString(),
    services: { database, cache, kafka },
  })
})

// ── Error handler (must be last)
app.use(errorHandler)

export default app
