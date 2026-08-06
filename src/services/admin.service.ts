import api from '@/lib/api'
import type { Admin, DashboardStats } from '@/types'

export const adminService = {
  getStats: () => api.get<DashboardStats>('/admin/stats').then((r) => r.data),

  listAdmins: (page = 1, limit = 20) => api.get<{ items: Admin[]; total: number }>('/admin/admins', {
    params: { page, limit },
  }).then((r) => r.data),

  createAdmin: (data: { email: string; full_name?: string; is_superadmin?: boolean }) => api.post<Admin>('/admin/admins', data).then((r) => r.data),

  updateAdmin: (id: string, data: Partial<Admin>) => api.patch<Admin>(`/admin/admins/${id}`, data).then((r) => r.data),

  deleteAdmin: (id: string) => api.delete(`/admin/admins/${id}`),

  resendInvite: (email: string) => api.get(`/admin/admins/${email}/resend-invite`),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/admin/me/change-password', data).then((r) => r.data),
}
