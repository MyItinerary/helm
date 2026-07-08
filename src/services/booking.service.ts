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
  }) => api.get<PaginatedResponse<Booking>>('/admin/bookings', { params }).then((r) => r.data),

  get: (id: string) => api.get<Booking>(`/admin/bookings/${id}`).then((r) => r.data),
}
