export type AdminRole = 'admin' | 'superadmin'

export interface Category {
  id: number
  parent_id: number | null
  slug: string
  text: string
  weight: number
  category_type: string
  is_active: boolean
  created_at: string
  updated_at: string
  admin_id: string | null
}

export interface CategoryCreate {
  parent_id?: number | null
  slug: string
  text: string
  weight: number
  category_type: string
  is_active?: boolean
}

export type CategoryUpdate = Partial<CategoryCreate>

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
  recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  recurrence_interval?: number
  recurrence_days?: string[]
  recurrence_month_mode?: 'day_of_month' | 'day_of_week'
  recurrence_month_days?: number[]
  recurrence_week_of_month?: number
  recurrence_weekday?: string
  recurrence_start_date?: string
  recurrence_end_type?: 'never' | 'on_date' | 'after_occurrences'
  recurrence_end_date?: string
  recurrence_count?: number
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

export type SocialMediaPlatform = "reddit" | "twitter" | "instagram" | "facebook";

export type TemporaryExperienceStatus = "pending" | "approved" | "rejected";

export type GeneratedExperienceJson = {
  title?: string;
  headline?: string;
  description?: string;
  city?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  duration_minutes?: number | null;
  price_from?: number | null;
  currency?: string;
  interest_tags?: string[];
  energy_level?: "chill" | "balanced" | "high" | string;
  budget_range?: "low" | "medium" | "high" | string;
  social_style?: string[];
  comfort_level?: "tourist" | "mixed" | "local" | string;
  time_of_day?: "morning" | "afternoon" | "evening" | "night" | string;
  what_you_will_do?: string[];
  whats_included?: string[];
  whats_not_included?: string[];
  requirements?: {
    fitness?: string;
    age?: string;
    accessibility?: string;
    [key: string]: unknown;
  };
  safety_info?: {
    riskLevel?: string;
    notes?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type TemporaryExperience = {
  id: string;
  generated_experience_json: GeneratedExperienceJson;
  social_media: SocialMediaPlatform | string;
  social_media_text: string;
  social_media_url?: string | null;
  social_media_post_id?: string | null;
  social_media_author?: string | null;
  media_url?: string | null;
  status: TemporaryExperienceStatus | string;
  experience_id?: string | null;
  reviewed_by_admin_id?: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at?: string | null;
};

export type SocialMediaImportRequest = {
  platforms: SocialMediaPlatform[];
  keywords: string[];
  days: number;
};

export type SocialMediaImportResponse = {
  total_found: number;
  total_analyzed: number;
  temporary_experiences_created: number;
  duplicates_skipped: number;
  skipped: number;
  errors: string[];
};

// One line of the NDJSON stream returned by POST /admin/social-media/import — see
// itin/app/core/services/social_media.py::SocialMediaImportSvc.run_import.
export type ImportProgressEvent =
  | { type: 'start'; platforms: SocialMediaPlatform[]; keywords: string[]; days: number; provider: string }
  | { type: 'phase'; phase: 'searching'; platform: string }
  | { type: 'phase'; phase: 'searched'; platform: string; found: number }
  | { type: 'phase'; phase: 'analyzing'; total: number }
  | { type: 'platform_error'; platform: string; message: string }
  | {
      type: 'item';
      current: number;
      total: number;
      platform: string;
      post_id: string;
      outcome: 'created' | 'duplicate' | 'error' | 'no_result';
      message: string;
    }
  | { type: 'fatal'; message: string }
  | { type: 'done'; summary: SocialMediaImportResponse };

export interface LoginResponse {
  access_token: string
  token_type: string
  role: AdminRole
}
