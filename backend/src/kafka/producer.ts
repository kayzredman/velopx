import { Kafka, type Producer } from 'kafkajs'

// Lazily created to avoid top-level crashes if kafkajs has load issues
let kafka: Kafka | undefined
let kafkaProducer: Producer | undefined

function getKafka(): Kafka {
  if (!kafka) {
    kafka = new Kafka({
      clientId: 'velopx-backend',
      brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
    })
  }
  return kafka
}

let _kafkaConnected = false

export function isKafkaConnected(): boolean {
  return _kafkaConnected
}

export async function connectKafka(): Promise<void> {
  kafkaProducer = getKafka().producer({ allowAutoTopicCreation: true })
  await kafkaProducer.connect()
  _kafkaConnected = true
}

export async function disconnectKafka(): Promise<void> {
  _kafkaConnected = false
  if (kafkaProducer) await kafkaProducer.disconnect()
}

export function publishEvent(topic: string, key: string, value: unknown): Promise<void> {
  if (!kafkaProducer || !_kafkaConnected) return Promise.resolve()
  return kafkaProducer
    .send({ topic, messages: [{ key, value: JSON.stringify(value) }] })
    .then(() => undefined)
}

// Export for consumers (auditConsumer uses this)
export { getKafka as kafka }
