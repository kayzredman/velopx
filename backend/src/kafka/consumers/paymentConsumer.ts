import { kafka } from '../producer'
import { prisma } from '../../db/prisma'
import { publishEvent } from '../events'
import { initiateFlutterwavePayment } from '../../services/flutterwave'

// ── paymentConsumer ─────────────────────────────────────────────────────────
//
// Handles two topics:
//
//   payment.initiate        — command emitted by POST /v1/payments
//     → calls payment provider (Flutterwave scaffold or live)
//     → updates Payment record with providerRef + checkoutUrl + status=processing
//     → emits payment.initiated (clients polling for-order/:id will see it)
//
//   payment.webhook_received — raw Flutterwave webhook payload
//     → updates Payment status (completed / failed)
//     → updates Order status to 'confirmed' on success
//     → emits payment.completed or payment.failed
//
// Consumer group: velopx-payment-processor
// Errors are swallowed per message — a bad event never kills the loop.
// ───────────────────────────────────────────────────────────────────────────

interface PaymentInitiateEvent {
  paymentId:   string
  orderId:     string
  amount:      number
  currency:    string
  method:      string
  provider:    string
  phoneNumber?: string
  email:       string
  name:        string
}

interface WebhookReceivedEvent {
  provider: string
  event:    string
  data: {
    tx_ref?:   string
    status?:   string
    amount?:   number
    currency?: string
    flw_ref?:  string
    meta?:     { orderId?: string }
  }
}

async function handlePaymentInitiate(raw: string): Promise<void> {
  const msg = JSON.parse(raw) as PaymentInitiateEvent

  try {
    let providerRef: string | undefined
    let checkoutUrl: string | undefined

    if (msg.provider === 'flutterwave') {
      const result = await initiateFlutterwavePayment({
        amount:      msg.amount,
        currency:    msg.currency,
        method:      msg.method,
        phoneNumber: msg.phoneNumber,
        orderId:     msg.orderId,
        email:       msg.email,
        name:        msg.name,
      })
      providerRef = result.providerRef
      checkoutUrl = result.checkoutUrl
    }
    // Additional providers: paystack, dpo, etc. — same pattern here

    await prisma.payment.update({
      where: { id: msg.paymentId },
      data:  {
        status:              'processing',
        providerRef,
        providerCheckoutUrl: checkoutUrl,
        updatedAt:           new Date(),
      },
    })

    await publishEvent('payment.initiated', {
      paymentId:   msg.paymentId,
      orderId:     msg.orderId,
      providerRef,
      checkoutUrl,
      amount:      msg.amount,
      currency:    msg.currency,
    })
  } catch (err) {
    // Mark payment failed so client doesn't poll forever
    await prisma.payment.update({
      where: { id: msg.paymentId },
      data:  {
        status:        'failed',
        failureReason: (err as Error).message ?? 'Provider call failed',
        updatedAt:     new Date(),
      },
    }).catch(() => undefined) // swallow — don't let a DB error mask the original error

    await publishEvent('payment.failed', {
      paymentId: msg.paymentId,
      orderId:   msg.orderId,
      reason:    (err as Error).message,
    })

    console.error('[paymentConsumer] handlePaymentInitiate failed:', err)
  }
}

async function handleWebhookReceived(raw: string): Promise<void> {
  const msg = JSON.parse(raw) as WebhookReceivedEvent

  // Only handle charge.completed from Flutterwave for now
  if (msg.provider !== 'flutterwave' || msg.event !== 'charge.completed') return

  const { tx_ref, status, meta } = msg.data
  const orderId = meta?.orderId

  if (!orderId || !tx_ref) return

  try {
    const payment = await prisma.payment.findUnique({ where: { orderId } })
    if (!payment) return

    const newStatus = status === 'successful' ? 'completed' : 'failed'

    await prisma.payment.update({
      where: { orderId },
      data:  {
        status:      newStatus,
        providerRef: tx_ref,
        completedAt: newStatus === 'completed' ? new Date() : undefined,
        updatedAt:   new Date(),
      },
    })

    if (newStatus === 'completed') {
      await prisma.order.update({
        where: { id: orderId },
        data:  { status: 'confirmed' },
      })

      await publishEvent('payment.completed', {
        paymentId: payment.id,
        orderId,
        txRef:     tx_ref,
      })
    } else {
      await publishEvent('payment.failed', {
        paymentId: payment.id,
        orderId,
        txRef:     tx_ref,
        reason:    `Provider status: ${status}`,
      })
    }
  } catch (err) {
    console.error('[paymentConsumer] handleWebhookReceived failed:', err)
    // Swallow — a failed DB write must never crash the consumer loop
  }
}

export async function startPaymentConsumer(): Promise<void> {
  const consumer = kafka().consumer({ groupId: 'velopx-payment-processor' })
  await consumer.connect()
  await consumer.subscribe({
    topics:        ['payment.initiate', 'payment.webhook_received'],
    fromBeginning: false,
  })

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return
      const raw = message.value.toString()

      try {
        if (topic === 'payment.initiate') {
          await handlePaymentInitiate(raw)
        } else if (topic === 'payment.webhook_received') {
          await handleWebhookReceived(raw)
        }
      } catch (err) {
        // Top-level swallow — individual handlers already log + recover,
        // but this guard ensures the consumer loop never dies.
        console.error(`[paymentConsumer] Unhandled error on topic ${topic}:`, err)
      }
    },
  })

  console.log('✓ Payment consumer running')
}
