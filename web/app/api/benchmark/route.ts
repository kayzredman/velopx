import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export async function GET(req: Request) {
  const { getToken } = await auth()
  const token = await getToken()
  const { searchParams } = new URL(req.url)

  const res = await fetch(`${API_URL}/v1/parts/benchmark?${searchParams}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  const text = await res.text()
  return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } })
}
