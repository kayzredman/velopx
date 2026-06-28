import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = 'GHS') {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency }).format(value)
}

export function expandUserRoles(role?: string | null, roles?: string[] | null): string[] {
  const set = new Set<string>()
  if (role) set.add(role)
  roles?.forEach((r) => set.add(r))
  return [...set]
}

export function isAssessorRole(role?: string | null, roles?: string[] | null): boolean {
  return expandUserRoles(role, roles).some((r) =>
    ['assessor', 'insurer_admin', 'insurer_staff', 'platform_admin'].includes(r)
  )
}

export function isInsurerRole(role?: string | null, roles?: string[] | null): boolean {
  return expandUserRoles(role, roles).some((r) => r === 'insurer_admin' || r === 'insurer_staff')
}

export function isDealerRole(role?: string | null, roles?: string[] | null): boolean {
  return expandUserRoles(role, roles).some((r) => r === 'dealer_owner' || r === 'dealer_staff')
}
