import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getToken } = await auth()
  const token = await getToken()
  const { id } = await params

  const res = await fetch(`${API_URL}/v1/quotes/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: await req.text(),
  })

  const text = await res.text()
  return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } })
}
