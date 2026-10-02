import api from '@/lib/api'

// itin serialises money as decimal strings ("12000.00").
type Money = string | number

export type TicketUnit = 'per_person' | 'per_booking' | 'per_day'
export type AddonUnit = 'per_booking' | 'per_person'

export interface TicketType {
  id: string
  experience_id: string
  label: string
  description?: string | null
  amount: Money
  pricing_unit: TicketUnit
}

export interface Addon {
  id: string
  experience_id: string
  label: string
  description?: string | null
  amount: Money
  pricing_unit: AddonUnit
  is_active: boolean
}

export interface PriceRule {
  id: string
  experience_id: string
  kind: 'early_bird' | 'day_of_week' | 'group'
  experience_price_id?: string | null
  label?: string | null
  unit_amount?: Money | null
  percent_off?: Money | null
  book_before?: string | null
  days_of_week?: number[] | null
  min_guests?: number | null
  is_active: boolean
}

export interface ExperiencePricing {
  currency: string
  prices: TicketType[]
  addons: Addon[]
  rules: PriceRule[]
}

export interface PromoCode {
  id: string
  code: string
  kind: 'percent' | 'fixed'
  value: Money
  currency?: string | null
  experience_id?: string | null
  starts_at?: string | null
  ends_at?: string | null
  max_redemptions?: number | null
  redemptions_count: number
  min_subtotal?: Money | null
  platform_share_percent: Money
  is_active: boolean
  created_at: string
}

const base = (experienceId: string) => `/experiences/${experienceId}`

export const pricingService = {
  get: (experienceId: string) =>
    api.get<ExperiencePricing>(`${base(experienceId)}/pricing`).then((r) => r.data),

  createTicket: (experienceId: string, data: Partial<TicketType>) =>
    api.post<TicketType>(`${base(experienceId)}/prices`, data).then((r) => r.data),
  updateTicket: (experienceId: string, id: string, data: Partial<TicketType>) =>
    api.patch<TicketType>(`${base(experienceId)}/prices/${id}`, data).then((r) => r.data),
  deleteTicket: (experienceId: string, id: string) =>
    api.delete(`${base(experienceId)}/prices/${id}`),

  createAddon: (experienceId: string, data: Partial<Addon>) =>
    api.post<Addon>(`${base(experienceId)}/addons`, data).then((r) => r.data),
  updateAddon: (experienceId: string, id: string, data: Partial<Addon>) =>
    api.patch<Addon>(`${base(experienceId)}/addons/${id}`, data).then((r) => r.data),
  deleteAddon: (experienceId: string, id: string) =>
    api.delete(`${base(experienceId)}/addons/${id}`),

  createRule: (experienceId: string, data: Partial<PriceRule>) =>
    api.post<PriceRule>(`${base(experienceId)}/price-rules`, data).then((r) => r.data),
  deleteRule: (experienceId: string, id: string) =>
    api.delete(`${base(experienceId)}/price-rules/${id}`),

  listPromoCodes: () => api.get<PromoCode[]>('/admin/promo-codes').then((r) => r.data),
  createPromoCode: (data: Record<string, unknown>) =>
    api.post<PromoCode>('/admin/promo-codes', data).then((r) => r.data),
  updatePromoCode: (id: string, data: Partial<PromoCode>) =>
    api.patch<PromoCode>(`/admin/promo-codes/${id}`, data).then((r) => r.data),
}

// The API's error detail, when it sent one.
export function apiErrorDetail(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg).replace(/^Value error, /, '')
  return fallback
}
