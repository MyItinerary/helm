import api from '@/lib/api'

// itin serialises money as decimal strings ("12000.00").
type Money = string | number

export interface Transaction {
  id: string
  booking_id?: string | null
  amount: Money
  currency: string
  provider?: string | null
  status: string
  external_payment_id?: string | null
  created_at: string
}

export interface PaymentsOverview {
  transactions: Transaction[]
  total: number
  page: number
  limit: number
}

// GET /admin/finance/summary — read from itin's ledger, one currency at a time.
export interface FinanceSummary {
  currency: string
  collected: Money
  refunded: Money
  paid_to_curators: Money
  commission: Money
  owed_to_curators: Money
  owed_by_curators: Money
  held_for_customers: Money
  provider_balance: Money
  open_refund_requests: number
  unmatched_payments: number
}

export interface CuratorBalance {
  guide_id: string
  name?: string | null
  email?: string | null
  owed_to_curator: Money
  owed_by_curator: Money
  paid_out: Money
  bookings_awaiting_payout: number
}

export interface UnmatchedPayment {
  id: string
  provider: string
  event_type: string
  status: 'unmatched' | 'amount_mismatch'
  reference?: string | null
  amount?: Money | null
  currency?: string | null
  booking_id?: string | null
  created_at: string
}

export const paymentService = {
  overview: (params?: { page?: number; limit?: number }) =>
    api.get<PaymentsOverview>('/admin/payments', { params }).then((r) => r.data),

  summary: (currency: string) =>
    api.get<FinanceSummary>('/admin/finance/summary', { params: { currency } }).then((r) => r.data),

  curators: (currency: string) =>
    api.get<CuratorBalance[]>('/admin/finance/curators', { params: { currency } }).then((r) => r.data),

  unmatched: () =>
    api.get<UnmatchedPayment[]>('/admin/finance/unmatched-payments').then((r) => r.data),
}

export const money = (amount: Money | null | undefined, currency?: string | null) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency || 'NGN' }).format(Number(amount ?? 0))
