import api from '@/lib/api'
import type { Booking, PaginatedResponse } from '@/types'

export const bookingService = {
  list: (params?: {
    page?: number
    limit?: number
    status?: string
    from?: string
    to?: string
    user_id?: string
    guide_id?: string
    experience_id?: string
    // When the session starts (UTC); from/to filter when it was booked.
    session_from?: string
    session_to?: string
    sort?: 'created_desc' | 'session_asc' | 'session_desc'
  }) => api.get<PaginatedResponse<Booking>>('/admin/bookings', { params }).then((r) => r.data),

  get: (id: string) => api.get<Booking>(`/admin/bookings/${id}`).then((r) => r.data),
}
