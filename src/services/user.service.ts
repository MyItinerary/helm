import api from '@/lib/api'
import type { User, UserDetail, PaginatedResponse } from '@/types'

/** Why DELETE /admin/users/{id} answered 409: what's still unresolved. */
export interface DeletionBlockers {
  upcoming_bookings: number
  open_refund_requests: number
  hosted_upcoming_bookings: number
  pending_payouts: number
}

export const userService = {
  list: (params?: { page?: number; limit?: number; search?: string }) => api.get<PaginatedResponse<User>>('/admin/users', { params }).then((r) => r.data),

  get: (id: string) => api.get<UserDetail>(`/admin/users/${id}`).then((r) => r.data),

  update: (id: string, data: Record<string, unknown>) => api.patch<UserDetail>(`/admin/users/${id}`, data).then((r) => r.data),

  // Anonymises: personal details go, bookings and payment records stay.
  // 409 with `blockers` while bookings, refunds or payouts are unresolved.
  delete: (id: string) => api.delete(`/admin/users/${id}`),
}
