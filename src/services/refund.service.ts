import api from '@/lib/api'

// itin serialises money as decimal strings ("12000.00").
type Money = string | number

export type RequestKind =
  | 'customer_cancellation'
  | 'curator_cancellation'
  | 'dispute'
  | 'admin_refund'
  | 'oversold'
  | 'duplicate_payment'

export interface RefundRecord {
  id: string
  amount: Money
  currency: string
  provider: string
  payment_reference: string
  provider_refund_id?: string | null
  justification: string
  created_at: string
}

export interface RefundBookingSummary {
  id: string
  status: string
  payment_status: string
  payout_status: string
  customer_email?: string | null
  experience_title?: string | null
  requested_datetime?: string | null
  party_size?: number | null
  currency?: string | null
  price_total?: Money | null
  checkout_fee_amount?: Money | null
  refunded_amount?: Money | null
  guide_earnings_amount?: Money | null
  cancellation_policy_snapshot?: string | null
  line_items: { kind: string; label: string; quantity: number; amount: Money }[]
  refunds: RefundRecord[]
}

export interface RefundRequest {
  id: string
  booking_id: string
  kind: RequestKind
  status: 'open' | 'resolved'
  requested_by: string
  reason?: string | null
  refund_amount?: Money | null
  admin_notes?: string | null
  payment_reference?: string | null
  created_at: string
  resolved_at?: string | null
  booking?: RefundBookingSummary | null
}

export interface RefundDecision {
  refund_amount?: string
  user_refund_percentage?: string
  experience_host_refund_percentage?: string
  cancel_booking?: boolean
  admin_notes: string
}

export const refundService = {
  queue: (params: { status: 'open' | 'resolved'; kind?: string }) =>
    api.get<RefundRequest[]>('/admin/refunds', { params }).then((r) => r.data),

  resolve: (requestId: string, decision: RefundDecision) =>
    api.post<RefundRequest>(`/admin/refunds/${requestId}/resolve`, decision).then((r) => r.data),

  refundBooking: (bookingId: string, decision: RefundDecision) =>
    api.post<RefundRequest>(`/admin/refunds/bookings/${bookingId}`, decision).then((r) => r.data),

  booking: (bookingId: string) =>
    api.get<RefundBookingSummary>(`/admin/refunds/bookings/${bookingId}`).then((r) => r.data),
}

export const KIND_LABEL: Record<RequestKind, string> = {
  customer_cancellation: 'Customer cancellation',
  curator_cancellation: 'Curator cancelled',
  dispute: 'Dispute',
  admin_refund: 'Admin refund',
  oversold: 'Oversold',
  duplicate_payment: 'Duplicate payment',
}

// Requests whose resolution cancels the booking by default (matches itin).
export const CANCELLING_KINDS: RequestKind[] = ['customer_cancellation', 'curator_cancellation', 'oversold']

export const money = (amount: Money | null | undefined, currency?: string | null) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency || 'NGN' }).format(Number(amount ?? 0))

export function apiErrorDetail(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg).replace(/^Value error, /, '')
  return fallback
}
