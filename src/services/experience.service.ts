import api from '@/lib/api'
import type { Experience, PaginatedResponse } from '@/types'

export const experienceService = {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }) => api.get<PaginatedResponse<Experience>>('/admin/experiences', { params }).then((r) => r.data),

  get: (id: string) => api.get<Experience>(`/admin/experiences/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') => api.patch<Experience>(`/admin/experiences/${id}`, { status }).then((r) => r.data),

  create: (data: Record<string, unknown>) => api.post<Experience>('/admin/experiences', data).then((r) => r.data),

  update: (id: string, data: Record<string, unknown>) => api.patch<Experience>(`/admin/experiences/${id}`, data).then((r) => r.data),
}
