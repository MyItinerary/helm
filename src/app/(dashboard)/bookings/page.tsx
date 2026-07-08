'use client'

import {
  Card, CardBody, CardHeader, Col, Form, Row, Spinner, Table,
} from 'react-bootstrap'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { bookingService } from '@/services/booking.service'
import StatusBadge from '@/components/ui/StatusBadge'

export default function BookingsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
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
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted py-4">No bookings found</td></tr>
                )}
                {data?.items.map((booking) => (
                  <tr key={booking.id} className="align-middle">
                    <td className="font-monospace small text-muted">
                      {booking.id.slice(0, 8)}...
                    </td>
                    <td className="small">{booking.user?.email ?? booking.user_id}</td>
                    <td className="small">{booking.experience?.title ?? booking.experience_id}</td>
                    <td>
                      {booking.amount != null
                        ? `${booking.currency ?? '$'}${booking.amount.toLocaleString()}`
                        : '—'}
                    </td>
                    <td><StatusBadge status={booking.status} /></td>
                    <td><StatusBadge status={booking.payment_status} /></td>
                    <td className="text-muted small">
                      {new Date(booking.created_at).toLocaleDateString()}
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
    </div>
  )
}
