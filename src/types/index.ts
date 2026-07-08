export type AdminRole = 'admin' | 'superadmin'

export interface Admin {
  id: string
  email: string
  full_name?: string
  is_superadmin: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  location?: string
}

export interface User {
  id: string
  email?: string
  signup_type: string
  is_email_verified: boolean
  is_temp: boolean
  created_at: string
  updated_at: string
}

export interface Guide {
  id: string
  display_name: string
  headline?: string
  about?: string
  city?: string
  country?: string
  languages?: string[]
  specialities?: string[]
  hourly_rate?: number
  currency?: string
  is_verified: boolean
  verification_level: 'unverified' | 'basic' | 'verified'
  rating_avg?: number
  rating_count?: number
  created_at: string
  updated_at?: string
}

export interface GuideVerification {
  id: string
  guide_id: string
  document_type: string
  document_number?: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  created_at: string
  updated_at: string
}

export interface Experience {
  id: string
  title: string
  description?: string
  location?: string
  city?: string
  country?: string
  duration?: number
  price?: number
  status: 'draft' | 'active' | 'suspended'
  guide_id: string
  guide?: Pick<Guide, 'id' | 'display_name'>
  tags?: string[]
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  guide_id: string
  experience_id: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'expired'
  payment_status: 'unpaid' | 'paid' | 'refunded'
  amount?: number
  currency?: string
  payment_provider?: 'stripe' | 'paystack'
  scheduled_at?: string
  created_at: string
  user?: Pick<User, 'id' | 'email'>
  guide?: Pick<Guide, 'id' | 'display_name'>
  experience?: Pick<Experience, 'id' | 'title'>
}

export interface Payment {
  id: string
  booking_id: string
  amount: number
  currency: string
  provider: 'stripe' | 'paystack'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  created_at: string
}

export interface DashboardStats {
  total_users: number
  total_guides: number
  active_bookings: number
  monthly_revenue: number
  pending_verifications: number
  bookings_by_month: Array<{ month: string; count: number; revenue: number }>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface LoginResponse {
  access_token: string
  token_type: string
  role: AdminRole
}
