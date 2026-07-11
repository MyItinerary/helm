import api from '@/lib/api'
import type { Guide, PaginatedResponse } from '@/types'

export const guideService = {
  list: (params?: { page?: number; limit?: number; search?: string }) => api.get<PaginatedResponse<Guide>>('/admin/guides', { params }).then((r) => r.data),

  listUnverified: () => api.get<Guide[]>('/admin/guides/unverified').then((r) => r.data),

  get: (id: string) => api.get<Guide>(`/admin/guides/${id}`).then((r) => r.data),

  update: (id: string, data: Partial<Guide>) => api.patch<Guide>(`/admin/guides/${id}`, data).then((r) => r.data),

  verify: (guideId: string, data: { status: 'approved' | 'rejected'; notes?: string }) => api.put(`/admin/guides/${guideId}/verify`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/admin/guides/${id}`),
}
