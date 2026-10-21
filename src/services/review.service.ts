import api from '@/lib/api'

export interface AdminReview {
  id: string
  booking_id: string
  experience_id?: string | null
  experience_title?: string | null
  guide_id: string
  user_id: string
  author_name: string
  author_email?: string | null
  rating: number
  comment?: string | null
  hidden_at?: string | null
  hidden_reason?: string | null
  created_at: string
  updated_at: string
}

export type ReviewTab = 'visible' | 'hidden'

export const reviewService = {
  list: (params: { status: ReviewTab; experience_id?: string }) =>
    api.get<AdminReview[]>('/admin/reviews', { params }).then((r) => r.data),

  hide: (reviewId: string, reason: string) =>
    api.post<AdminReview>(`/admin/reviews/${reviewId}/hide`, { reason }).then((r) => r.data),

  unhide: (reviewId: string) =>
    api.post<AdminReview>(`/admin/reviews/${reviewId}/unhide`).then((r) => r.data),
}

export const stars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating)
