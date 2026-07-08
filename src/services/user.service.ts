import api from '@/lib/api'
import type { User, PaginatedResponse } from '@/types'

export const userService = {
  list: (params?: { page?: number; limit?: number; search?: string }) => api.get<PaginatedResponse<User>>('/admin/users', { params }).then((r) => r.data),

  get: (id: string) => api.get<User>(`/admin/users/${id}`).then((r) => r.data),

  update: (id: string, data: Partial<User>) => api.patch<User>(`/admin/users/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/admin/users/${id}`),
}
