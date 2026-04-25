// Shared type definitions for the velopX backend

export type UserRole =
  | 'dealer_owner'
  | 'dealer_staff'
  | 'garage_owner'
  | 'garage_staff'
  | 'assessor'
  | 'insurer_admin'
  | 'insurer_staff'
  | 'driver'
  | 'platform_admin'

export type OrgType = 'dealer' | 'garage' | 'insurance_company' | 'courier'

export interface VehicleProfile {
  vin?: string
  make: string
  model: string
  year: number
  engine?: string
  bodyType?: string
  countryOfOrigin?: string
}

export interface PartAttributes {
  [key: string]: unknown
}

// API response envelope
export interface ApiResponse<T = unknown> {
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

// Pagination query params
export interface PaginationQuery {
  page?: number
  limit?: number
}
