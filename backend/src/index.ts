import 'dotenv/config'
import app from './app'
import { connectKafka, disconnectKafka } from './kafka/producer'
import { startAuditConsumer } from './kafka/consumers/auditConsumer'
import { startPaymentConsumer } from './kafka/consumers/paymentConsumer'
import { prisma } from './db/prisma'

const PORT = process.env.PORT || 3000

async function bootstrap() {
  // Start HTTP server immediately — don't block on Kafka
  app.listen(PORT, () => {
    console.log(`✓ velopX API running on :${PORT}`)
  })

  // Connect Kafka in background — failures are non-fatal
  // Both consumers start together; either can fail independently without
  // taking down the other or the HTTP server.
  connectKafka()
    .then(() => Promise.all([startAuditConsumer(), startPaymentConsumer()]))
    .then(() => console.log('✓ Kafka connected (audit + payment consumers running)'))
    .catch((err) => console.warn('⚠ Kafka unavailable (async processing disabled):', (err as Error).message))
}

async function shutdown() {
  console.log('Shutting down...')
  await disconnectKafka()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

bootstrap()
