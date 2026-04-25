import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { clerkMiddleware } from '@clerk/express'
import { auditCapture } from './middleware/auditCapture'
import { errorHandler } from './middleware/errorHandler'
import v1Router from './routes/v1'

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

// ── Health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() })
})

// ── Error handler (must be last)
app.use(errorHandler)

export default app
