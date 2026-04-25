import 'dotenv/config'
import app from './app'
import { connectKafka, disconnectKafka } from './kafka/producer'
import { startAuditConsumer } from './kafka/consumers/auditConsumer'
import { prisma } from './db/prisma'

const PORT = process.env.PORT || 3000

async function bootstrap() {
  try {
    await connectKafka()
    await startAuditConsumer()
    console.log('✓ Kafka connected')

    app.listen(PORT, () => {
      console.log(`✓ velopX API running on :${PORT}`)
    })
  } catch (err) {
    console.error('Bootstrap failed:', err)
    process.exit(1)
  }
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
