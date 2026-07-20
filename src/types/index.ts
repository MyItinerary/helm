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

export interface Profile {
  full_name?: string
  avatar_url?: string
  bio?: string
  home_country?: string
  preferred_currency?: string
  preferred_language?: string
  date_of_birth?: string
  energy_level?: string
  interests?: string[]
  social_style?: string
  budget_range?: string
  comfort_level?: string
  trip_intent?: string[]
  completed?: boolean
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

export interface UserDetail extends User {
  profile?: Profile
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
  verification_level: 'none' | 'basic' | 'enhanced'
  rating_avg?: number
  rating_count?: number
  created_at: string
  updated_at?: string
  verification?: GuideVerification
}

export interface GuideVerification {
  id: number
  guide_id: string
  id_document_type?: string
  id_document_number?: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  submitted_at: string
  reviewed_at?: string
}

export interface ExperienceRequirements {
  fitness_level?: string
  age?: string
  accessibility?: string
}

export interface SafetyInfo {
  riskLevel: string
  notes: string[]
  recommendedTimeOfDay?: string
  mobilityAccessibility: string
  emergencyGuidance?: string
}

export interface Experience {
  id: string
  title: string
  headline?: string
  description?: string
  city?: string
  country?: string
  latitude?: number
  longitude?: number
  duration_minutes?: number
  group_size_min?: number
  group_size_max?: number
  price_from?: number
  currency?: string
  status: 'ACTIVE' | 'INACTIVE'
  guide_id: string
  guide?: Pick<Guide, 'id' | 'display_name'>
  interest_tags?: string[]
  energy_level?: string
  budget_range?: string
  social_style?: string[]
  comfort_level?: string
  time_of_day?: string
  schedule_type?: 'one_off' | 'recurring'
  event_start_date?: string
  event_end_date?: string
  start_time?: string
  recurrence_type?: 'weekly' | 'monthly'
  recurrence_days?: string[]
  recurrence_month_days?: number[]
  recurrence_start_date?: string
  recurrence_end_date?: string
  is_featured?: boolean
  cover_image_url?: string
  booking_url?: string
  what_you_will_do?: string[]
  whats_included?: string[]
  whats_not_included?: string[]
  requirements?: ExperienceRequirements
  safety_info?: SafetyInfo
  cancellation_policy?: string
  created_at: string
  updated_at?: string
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
