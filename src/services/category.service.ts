import api from '@/lib/api'
import type { Category, CategoryCreate, CategoryUpdate } from '@/types'

export const categoryService = {
  list: (categoryType?: string) => api.get<Category[]>('/admin/categories', { params: categoryType ? { category_type: categoryType } : undefined }).then((r) => r.data),

  create: (data: CategoryCreate) => api.post<Category>('/admin/categories', data).then((r) => r.data),

  update: (id: number, data: CategoryUpdate) => api.put<Category>(`/admin/categories/${id}`, data).then((r) => r.data),

  deactivate: (id: number) => api.delete<Category>(`/admin/categories/${id}`).then((r) => r.data),
}
