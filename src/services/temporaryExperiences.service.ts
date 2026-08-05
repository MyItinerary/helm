import api from '@/lib/api'
import type {
  TemporaryExperience,
  SocialMediaImportRequest,
  SocialMediaImportResponse,
  GeneratedExperienceJson,
} from '@/types'

export const temporaryExperiencesService = {
  import: (data: SocialMediaImportRequest) =>
    api.post<SocialMediaImportResponse>('/admin/social-media/import', data).then((r) => r.data),

  list: (params?: { status?: string; social_media?: string; limit?: number; offset?: number }) =>
    api.get<TemporaryExperience[]>('/admin/temporary-experiences', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<TemporaryExperience>(`/admin/temporary-experiences/${id}`).then((r) => r.data),

  update: (id: string, data: { generated_experience_json: GeneratedExperienceJson; media_url?: string | null }) =>
    api.patch<TemporaryExperience>(`/admin/temporary-experiences/${id}`, data).then((r) => r.data),

  approve: (id: string) =>
    api.post<{ status: string; experience_id: string }>(`/admin/temporary-experiences/${id}/approve`).then((r) => r.data),

  reject: (id: string, reason: string) =>
    api.post<{ status: string }>(`/admin/temporary-experiences/${id}/reject`, { reason }).then((r) => r.data),
}
