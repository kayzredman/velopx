import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { clerkMiddleware } from '@clerk/express'
import { auditCapture } from './middleware/auditCapture'
import { errorHandler } from './middleware/errorHandler'
import v1Router from './routes/v1'
import webhooksRouter from './routes/v1/webhooks'
import docsRouter from './routes/docs'
import { hasValidClerkKeys } from './lib/clerkConfig'
import { getHealthReport } from './lib/healthStatus'

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

// ── Health & docs (before auth — used by Docker healthcheck)
app.get('/health', async (_req, res, next) => {
  try {
    const report = await getHealthReport()
    res.status(report.status === 'error' ? 503 : 200).json(report)
  } catch (err) {
    next(err)
  }
})

app.use(docsRouter)

// ── Clerk webhooks need raw body for Svix verification — before JSON parser
app.use('/v1/webhooks', express.raw({ type: 'application/json' }), webhooksRouter)

// ── Body parsing
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Clerk JWT middleware — skip when placeholder keys (local/docker smoke)
if (hasValidClerkKeys()) {
  app.use(clerkMiddleware())
} else {
  console.warn('[clerk] Placeholder or missing keys — auth middleware disabled')
}

// ── Audit capture — fires on res.finish, publishes to Kafka (never blocks)
app.use(auditCapture)

// ── Routes
app.use('/v1', v1Router)

// ── Error handler (must be last)
app.use(errorHandler)

export default app
