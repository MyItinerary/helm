'use client'

import {
  Button, ButtonGroup, Card, CardBody, CardHeader, Col, Form, Row, Spinner, Table,
} from 'react-bootstrap'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { bookingService } from '@/services/booking.service'
import { availabilityService } from '@/services/availability.service'
import { experienceService } from '@/services/experience.service'
import { money } from '@/services/refund.service'
import StatusBadge from '@/components/ui/StatusBadge'
import RefundDecisionModal from '@/components/refunds/RefundDecisionModal'
import type { Booking } from '@/types'
import { formatLocalDate, formatSessionTime } from '@/utils/schedule'

type Sort = 'created_desc' | 'session_asc' | 'session_desc'

// Session times are shown in the zone the session runs in (saved on the
// booking), not the admin's browser zone. Older bookings are Lagos.
const sessionTime = (b: Booking) => (b.requested_datetime
  ? formatSessionTime(b.requested_datetime, b.session_timezone ?? 'Africa/Lagos')
  : '—')

// The session-date filters send whole UTC days (the API filters on UTC
// start times); the "By date" view groups by each session's local date.
const dayStart = (d: string) => `${d}T00:00:00Z`
const dayEnd = (d: string) => `${d}T23:59:59Z`

function BookingsByDate({ experienceId, from, to }: { experienceId: string; from: string; to: string }) {
  const [includeUnpaid, setIncludeUnpaid] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'by-date', experienceId, from, to, includeUnpaid],
    queryFn: () => availabilityService.bookingsByDate({
      experience_id: experienceId || undefined,
      from: from || undefined,
      to: to || undefined,
      include_unpaid: includeUnpaid,
    }),
  })
  return (
    <CardBody>
      <Form.Check
        type="switch"
        id="include-unpaid"
        className="mb-3"
        label="Include bookings awaiting payment"
        checked={includeUnpaid}
        onChange={(e) => setIncludeUnpaid(e.target.checked)}
      />
      {isLoading && <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>}
      {data?.length === 0 && <p className="text-muted mb-0">No bookings in these dates.</p>}
      {data?.map((day) => (
        <div key={day.date} className="mb-4">
          <h6 className="mb-2">
            {formatLocalDate(day.date)}
            <span className="text-muted small ms-2">
              {day.bookings_count} booking{day.bookings_count === 1 ? '' : 's'} · {day.guests} guest{day.guests === 1 ? '' : 's'}
            </span>
          </h6>
          <Table size="sm" responsive className="mb-0">
            <tbody>
              {day.bookings.map((b) => (
                <tr key={b.id} className="align-middle">
                  <td className="small text-nowrap" style={{ width: 200 }}>{sessionTime(b)}</td>
                  <td className="small">{b.experience_title ?? b.experience_id}</td>
                  <td className="small">{b.party_size ?? 1} guest{(b.party_size ?? 1) === 1 ? '' : 's'}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td><StatusBadge status={b.payment_status} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ))}
    </CardBody>
  )
}

export default function BookingsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [experienceId, setExperienceId] = useState('')
  const [sessionFrom, setSessionFrom] = useState('')
  const [sessionTo, setSessionTo] = useState('')
  const [sort, setSort] = useState<Sort>('created_desc')
  const [view, setView] = useState<'list' | 'by-date'>('list')
  const [refundingId, setRefundingId] = useState<string | null>(null)
  const limit = 20

  const { data: experiences } = useQuery({
    queryKey: ['experiences', 'options'],
    queryFn: () => experienceService.list({ limit: 100 }),
  })
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, statusFilter, experienceId, sessionFrom, sessionTo, sort],
    queryFn: () => bookingService.list({
      page,
      limit,
      status: statusFilter || undefined,
      experience_id: experienceId || undefined,
      session_from: sessionFrom ? dayStart(sessionFrom) : undefined,
      session_to: sessionTo ? dayEnd(sessionTo) : undefined,
      sort,
    }),
    enabled: view === 'list',
  })
  const filter = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1) }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Bookings</h4>
        <div className="d-flex align-items-center gap-3">
          {view === 'list' && <small className="text-muted">{data?.total ?? 0} total</small>}
          <ButtonGroup size="sm">
            <Button variant={view === 'list' ? 'primary' : 'outline-primary'} onClick={() => setView('list')}>List</Button>
            <Button variant={view === 'by-date' ? 'primary' : 'outline-primary'} onClick={() => setView('by-date')}>By date</Button>
          </ButtonGroup>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label className="small mb-0">Experience</Form.Label>
              <Form.Select size="sm" value={experienceId} onChange={(e) => filter(setExperienceId)(e.target.value)}>
                <option value="">All experiences</option>
                {experiences?.items.map((exp) => <option key={exp.id} value={exp.id}>{exp.title}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small mb-0">Session from</Form.Label>
              <Form.Control type="date" size="sm" value={sessionFrom} onChange={(e) => filter(setSessionFrom)(e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label className="small mb-0">Session to</Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={sessionTo}
                min={sessionFrom || undefined}
                onChange={(e) => filter(setSessionTo)(e.target.value)}
              />
            </Col>
            {view === 'list' && (
              <>
                <Col md={2}>
                  <Form.Label className="small mb-0">Status</Form.Label>
                  <Form.Select size="sm" value={statusFilter} onChange={(e) => filter(setStatusFilter)(e.target.value)}>
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="small mb-0">Sort</Form.Label>
                  <Form.Select size="sm" value={sort} onChange={(e) => filter(setSort)(e.target.value as Sort)}>
                    <option value="created_desc">Newest bookings first</option>
                    <option value="session_asc">Soonest session first</option>
                    <option value="session_desc">Latest session first</option>
                  </Form.Select>
                </Col>
              </>
            )}
          </Row>
        </CardHeader>
        {view === 'by-date' ? (
          <BookingsByDate experienceId={experienceId} from={sessionFrom} to={sessionTo} />
        ) : (
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
                  <th title="In the time zone the session runs in">Session</th>
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
                    <td className="small">{booking.experience_title ?? booking.experience?.title ?? booking.experience_id}</td>
                    <td className="small text-nowrap">
                      {sessionTime(booking)}
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
        )}
        {view === 'list' && data && data.total > limit && (
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
