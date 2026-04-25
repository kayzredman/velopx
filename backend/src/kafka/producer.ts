import { Kafka, type Producer } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'velopx-backend',
  brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
})

export const kafkaProducer: Producer = kafka.producer({
  allowAutoTopicCreation: true,
})

export async function connectKafka(): Promise<void> {
  await kafkaProducer.connect()
}

export async function disconnectKafka(): Promise<void> {
  await kafkaProducer.disconnect()
}

export { kafka }
