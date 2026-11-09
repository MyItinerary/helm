import api from '@/lib/api'
import type { Experience, PaginatedResponse } from '@/types'

export const experienceService = {
  // unreviewed: live host listings no admin has checked yet.
  list: (params?: { page?: number; limit?: number; status?: string; search?: string; unreviewed?: boolean }) => api.get<PaginatedResponse<Experience>>('/admin/experiences', { params }).then((r) => r.data),

  get: (id: string) => api.get<Experience>(`/admin/experiences/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') => api.patch<Experience>(`/admin/experiences/${id}`, { status }).then((r) => r.data),

  // approve keeps it live and marks it checked; reject takes it down and
  // emails the host the note.
  review: (id: string, decision: 'approve' | 'reject', note?: string) => api
    .post<Experience>(`/admin/experiences/${id}/review`, { decision, note })
    .then((r) => r.data),

  create: (data: Record<string, unknown>) => api.post<Experience>('/admin/experiences', data).then((r) => r.data),

  // confirm: save even if upcoming bookings lose their session (the API
  // otherwise answers 409 with detail.orphaned_bookings).
  update: (id: string, data: Record<string, unknown>, options?: { confirm?: boolean }) => api
    .patch<Experience>(`/admin/experiences/${id}`, data, { params: options?.confirm ? { confirm: true } : undefined })
    .then((r) => r.data),
}

// The number of upcoming bookings an update would strand, when the API
// refused it for that reason (409).
export function orphanedBookings(error: unknown): number | null {
  const response = (error as { response?: { status?: number; data?: { detail?: { orphaned_bookings?: number } } } })?.response
  if (response?.status !== 409) return null
  const count = response.data?.detail?.orphaned_bookings
  return typeof count === 'number' ? count : null
}
