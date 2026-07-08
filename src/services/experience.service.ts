import api from '@/lib/api'
import type { Experience, PaginatedResponse } from '@/types'

export const experienceService = {
  list: (params?: { page?: number; limit?: number; status?: string }) => api.get<PaginatedResponse<Experience>>('/admin/experiences', { params }).then((r) => r.data),

  get: (id: string) => api.get<Experience>(`/admin/experiences/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: 'active' | 'draft' | 'suspended') => api.patch<Experience>(`/admin/experiences/${id}`, { status }).then((r) => r.data),
}
