'use client'

import {
  Button, Card, CardBody, CardHeader, Col, Form, Row, Spinner, Table,
} from 'react-bootstrap'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { bookingService } from '@/services/booking.service'
import { money } from '@/services/refund.service'
import StatusBadge from '@/components/ui/StatusBadge'
import RefundDecisionModal from '@/components/refunds/RefundDecisionModal'

// itin builds every schedule in one time zone (SCHEDULE_TIMEZONE), so show
// session times there rather than in the admin's browser zone.
const SESSION_TIME_ZONE = 'Africa/Lagos'
const sessionFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: SESSION_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
// itin sends naive UTC timestamps (no "Z"), so mark them as UTC before parsing.
const parseUtc = (value: string) => new Date(/(Z|[+-]\d\d:?\d\d)$/i.test(value) ? value : `${value}Z`)

export default function BookingsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [refundingId, setRefundingId] = useState<string | null>(null)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, statusFilter],
    queryFn: () => bookingService.list({ page, limit, status: statusFilter || undefined }),
  })

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Bookings</h4>
        <small className="text-muted">{data?.total ?? 0} total</small>
      </div>

      <Card>
        <CardHeader>
          <Row>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </Form.Select>
            </Col>
          </Row>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Booking ID</th>
                  <th>User</th>
                  <th>Experience</th>
                  <th title={`Times in ${SESSION_TIME_ZONE}`}>Session</th>
                  <th>Guests</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Booked</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.items.length === 0 && (
                  <tr><td colSpan={10} className="text-center text-muted py-4">No bookings found</td></tr>
                )}
                {data?.items.map((booking) => (
                  <tr key={booking.id} className="align-middle">
                    <td className="font-monospace small text-muted">
                      {booking.id.slice(0, 8)}...
                    </td>
                    <td className="small">{booking.user?.email ?? booking.user_id}</td>
                    <td className="small">{booking.experience?.title ?? booking.experience_id}</td>
                    <td className="small text-nowrap">
                      {booking.requested_datetime ? sessionFormat.format(parseUtc(booking.requested_datetime)) : '—'}
                    </td>
                    <td className="small">{booking.party_size ?? '—'}</td>
                    <td>
                      {booking.price_total != null ? money(booking.price_total, booking.currency) : '—'}
                      {Number(booking.refunded_amount ?? 0) > 0 && (
                        <div className="small text-success">−{money(booking.refunded_amount, booking.currency)} refunded</div>
                      )}
                    </td>
                    <td><StatusBadge status={booking.status} /></td>
                    <td><StatusBadge status={booking.payment_status} /></td>
                    <td className="text-muted small">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      {(booking.payment_status === 'paid' || booking.payment_status === 'partial') && (
                        <Button size="sm" variant="outline-danger" onClick={() => setRefundingId(booking.id)}>
                          Refund
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
        {data && data.total > limit && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total}
            </small>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page * limit >= data.total} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </Card>

      <RefundDecisionModal show={!!refundingId} bookingId={refundingId} onHide={() => setRefundingId(null)} />
    </div>
  )
}
