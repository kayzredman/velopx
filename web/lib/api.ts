import { auth } from '@clerk/nextjs/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { getToken } = await auth()
  const token = await getToken()

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export async function publicFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<T>
}

export interface Part {
  id: string
  name: string
  description?: string | null
  oemNumber?: string | null
  condition: 'oem' | 'aftermarket' | 'used'
  price: string
  currency: string
  country: string
  stockStatus: string
  images: string[]
  dealer?: { id: string; name: string | null; email?: string; role?: string }
}

export interface Order {
  id: string
  status: string
  totalAmount: string
  currency: string
  claimReference?: string | null
  createdAt: string
  items: Array<{ id: string; part: { id: string; name: string; oemNumber?: string | null } }>
  delivery?: { id: string; status: string } | null
}

export interface Quote {
  id: string
  status: string
  claimReference?: string | null
  createdAt: string
  requester?: { id: string; name: string | null; email: string }
  items: Array<{
    id: string
    price: string
    currency: string
    part: { id: string; name: string; oemNumber?: string | null; condition: string }
  }>
}

export interface Delivery {
  id: string
  status: string
  driverId?: string | null
  driver?: { id: string; name: string | null; email: string } | null
  order: Order & { buyer?: { name: string | null; email: string } }
}
