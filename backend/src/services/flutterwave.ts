/**
 * Flutterwave payment provider adapter.
 *
 * Runs in scaffold mode (returns deterministic mock data) when
 * FLUTTERWAVE_SECRET_KEY is not set. Swap in the real key at go-live —
 * no code changes needed.
 */

export interface InitiatePaymentParams {
  amount: number
  currency: string
  method: string
  phoneNumber?: string
  orderId: string
  email: string
  name: string
}

export interface InitiatePaymentResult {
  providerRef: string
  checkoutUrl?: string
}

// AbortController timeout (ms) for the Flutterwave API call
const FLUTTERWAVE_TIMEOUT_MS = 10_000

export async function initiateFlutterwavePayment(
  params: InitiatePaymentParams,
): Promise<InitiatePaymentResult> {
  const flwSecretKey = process.env.FLUTTERWAVE_SECRET_KEY

  if (!flwSecretKey) {
    // Scaffold mode — deterministic mock, no network call
    return {
      providerRef: `FLW-MOCK-${params.orderId.slice(0, 8).toUpperCase()}`,
      checkoutUrl: `https://checkout.flutterwave.com/v3/hosted/pay/MOCK-${params.orderId}`,
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FLUTTERWAVE_TIMEOUT_MS)

  const txRef = `VPX-${params.orderId}-${Date.now()}`

  const payload: Record<string, unknown> = {
    tx_ref:       txRef,
    amount:       params.amount,
    currency:     params.currency,
    redirect_url: process.env.PAYMENT_REDIRECT_URL ?? 'https://velopx.app/payment/callback',
    customer: {
      email:       params.email,
      phonenumber: params.phoneNumber,
      name:        params.name,
    },
    customizations: {
      title:       'VelopX Parts Payment',
      description: `Order ${params.orderId}`,
    },
    meta: { orderId: params.orderId },
  }

  if (params.method === 'mobile_money') {
    payload.payment_options = 'mobilemoneyghana,mobilemoneyuganda,mobilemoneyke'
  }

  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method:  'POST',
      headers: {
        Authorization: `Bearer ${flwSecretKey}`,
        'Content-Type': 'application/json',
      },
      body:   JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Flutterwave API error: ${err}`)
    }

    const json = await response.json() as { data?: { link?: string } }
    return {
      providerRef: txRef,
      checkoutUrl: json.data?.link,
    }
  } finally {
    clearTimeout(timeout)
  }
}
