import Cookies from 'js-cookie'
import api, { TOKEN_COOKIE } from '@/lib/api'
import type {
  TemporaryExperience,
  SocialMediaImportRequest,
  GeneratedExperienceJson,
  PaginatedResponse,
  ImportProgressEvent,
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export const temporaryExperiencesService = {
  list: (params?: {
    status?: string; social_media?: string; search?: string; page?: number; limit?: number
  }) =>
    api.get<PaginatedResponse<TemporaryExperience>>('/admin/temporary-experiences', { params }).then((r) => r.data),

  // Streams NDJSON progress events from POST /admin/social-media/import. Uses a raw
  // fetch() rather than the shared axios instance because axios can't consume a
  // streamed response body incrementally in the browser. Resolves once the stream ends
  // having seen a "done" event; rejects on a non-2xx response, a JSON-parse failure, or
  // if the stream ends without ever reaching "done" (covers both a dropped connection
  // and a backend "fatal" event, since the server stops the stream right after it).
  importStream: async (
    data: SocialMediaImportRequest,
    onEvent: (event: ImportProgressEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/admin/social-media/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Cookies.get(TOKEN_COOKIE)}`,
      },
      body: JSON.stringify(data),
      signal,
    })
    if (!res.ok || !res.body) {
      const detail = await res.json().catch(() => null)
      throw new Error(detail?.detail ?? `Import failed (${res.status})`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let sawDone = false

    const handleLine = (line: string) => {
      if (!line.trim()) return
      const event = JSON.parse(line) as ImportProgressEvent
      if (event.type === 'done') sawDone = true
      onEvent(event)
    }

    for (;;) {
      // eslint-disable-next-line no-await-in-loop
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      lines.forEach(handleLine)
    }
    if (buffer.trim()) handleLine(buffer)

    if (!sawDone) {
      throw new Error('Import stream ended unexpectedly before completion.')
    }
  },

  get: (id: string) =>
    api.get<TemporaryExperience>(`/admin/temporary-experiences/${id}`).then((r) => r.data),

  update: (id: string, data: { generated_experience_json: GeneratedExperienceJson; media_url?: string | null }) =>
    api.patch<TemporaryExperience>(`/admin/temporary-experiences/${id}`, data).then((r) => r.data),

  approve: (id: string) =>
    api.post<{ status: string; experience_id: string }>(`/admin/temporary-experiences/${id}/approve`).then((r) => r.data),

  reject: (id: string, reason: string) =>
    api.post<{ status: string }>(`/admin/temporary-experiences/${id}/reject`, { reason }).then((r) => r.data),
}
