import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export async function GET(req: NextRequest) {
  const { getToken } = await auth()
  const token = await getToken()
  const search = req.nextUrl.search

  const res = await fetch(`${API_URL}/v1/parts/marketplace${search}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  })

  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
