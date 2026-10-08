import api from '@/lib/api'
import type { Booking } from '@/types'

// A blocked date range (or one session time on those dates) of an experience.
// Dates are local to the experience's time zone.
export interface Blackout {
  id: string
  experience_id: string
  starts_on: string
  ends_on: string
  start_time?: string | null // "HH:MM:SS"; null blocks whole days
  reason?: string | null
  source: 'admin' | 'guide' | 'session_cancel'
  created_at: string
}

export interface BlackoutCreate {
  starts_on: string
  ends_on?: string
  start_time?: string
  reason?: string
  // Cancel the bookings the block hits (paid ones go to the refund queue).
  cancel_bookings?: boolean
}

export interface BlackoutCreated {
  blackout: Blackout
  cancelled: number
  refund_requests: number
}

export interface AdminSession {
  starts_at: string // UTC
  ends_at: string
  local_date: string
  local_time: string
  end_local_date: string
  // False for bookings at a time the schedule doesn't have.
  scheduled: boolean
  capacity: number | null
  confirmed: number
  held: number
  seats_left: number | null
  bookings_count: number
  blocked: boolean
  blackout_ids: string[]
}

export interface AdminSessions {
  experience_id: string
  timezone: string
  sessions: AdminSession[]
}

export interface BookingDay {
  date: string
  bookings_count: number
  guests: number
  bookings: Booking[]
}

export const availabilityService = {
  blocks: (experienceId: string) => api
    .get<Blackout[]>(`/experiences/${experienceId}/blackouts`).then((r) => r.data),
  block: (experienceId: string, data: BlackoutCreate) => api
    .post<BlackoutCreated>(`/experiences/${experienceId}/blackouts`, data).then((r) => r.data),
  unblock: (experienceId: string, blackoutId: string) => api
    .delete(`/experiences/${experienceId}/blackouts/${blackoutId}`),
  sessions: (experienceId: string, params: { from?: string; to?: string }) => api
    .get<AdminSessions>(`/admin/experiences/${experienceId}/sessions`, { params }).then((r) => r.data),
  bookingsByDate: (params: { from?: string; to?: string; experience_id?: string; include_unpaid?: boolean }) => api
    .get<BookingDay[]>('/admin/bookings/by-date', { params }).then((r) => r.data),
}

// The number of upcoming bookings a block would hit, when the API refused
// it for that reason (409).
export function affectedBookings(error: unknown): number | null {
  const response = (error as { response?: { status?: number; data?: { detail?: { affected_bookings?: number } } } })?.response
  if (response?.status !== 409) return null
  const count = response.data?.detail?.affected_bookings
  return typeof count === 'number' ? count : null
}
