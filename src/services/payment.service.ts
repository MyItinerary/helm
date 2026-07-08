import api from '@/lib/api'

interface PaymentSummary {
  total_revenue: number
  pending_payouts: number
  completed_payouts: number
}

interface Transaction {
  id: string
  booking_id: string
  amount: number
  currency: string
  provider: string
  status: string
  created_at: string
}

export interface PaymentsOverview {
  summary: PaymentSummary
  transactions: Transaction[]
}

export const paymentService = {
  overview: (params?: { from?: string; to?: string; provider?: string; page?: number; limit?: number }) => api.get<PaymentsOverview>('/admin/payments', { params }).then((r) => r.data),

  transfer: (data: { booking_id: string; amount: number }) => api.post('/payments/transfer', data).then((r) => r.data),
}
