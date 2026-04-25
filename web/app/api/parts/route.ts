import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

async function proxyRequest(req: NextRequest, url: string): Promise<NextResponse> {
  const { getToken } = await auth()
  const token = await getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined

  const upstream = await fetch(`${API_URL}${url}`, {
    method: req.method,
    headers,
    body,
  })

  const data = await upstream.text()
  return new NextResponse(data, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function GET(req: NextRequest) {
  const search = req.nextUrl.search
  return proxyRequest(req, `/v1/parts${search}`)
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, '/v1/parts')
}
