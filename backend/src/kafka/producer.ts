import { Kafka, type Producer } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'velopx-backend',
  brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
})

export const kafkaProducer: Producer = kafka.producer({
  allowAutoTopicCreation: true,
})

let _kafkaConnected = false

export function isKafkaConnected(): boolean {
  return _kafkaConnected
}

export async function connectKafka(): Promise<void> {
  await kafkaProducer.connect()
  _kafkaConnected = true
}

export async function disconnectKafka(): Promise<void> {
  _kafkaConnected = false
  await kafkaProducer.disconnect()
}

export { kafka }
