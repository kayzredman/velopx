import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

async function proxy(req: NextRequest, path: string) {
  const { getToken } = await auth()
  const token = await getToken()
  const search = req.nextUrl.search

  const res = await fetch(`${API_URL}${path}${search}`, {
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

export async function GET(req: NextRequest) {
  return proxy(req, '/v1/directory/dealers')
}
