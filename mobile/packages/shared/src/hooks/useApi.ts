import { useAuth } from '@clerk/clerk-expo'
import { useCallback, useRef } from 'react'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3100'

export function useApi() {
  const { getToken } = useAuth()
  const getTokenRef = useRef(getToken)
  getTokenRef.current = getToken

  const apiFetch = useCallback(async <T>(path: string, options?: RequestInit): Promise<T> => {
    const token = await getTokenRef.current()

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
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

    if (res.status === 204) {
      return undefined as T
    }

    const text = await res.text()
    if (!text) {
      return undefined as T
    }

    return JSON.parse(text) as T
  }, [])

  return { apiFetch }
}
