'use client'

import {
  Badge, Button, Card, CardBody, CardHeader, Col, Form, Row, Spinner, Table,
} from 'react-bootstrap'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Fragment, useState } from 'react'
import { addDays, format } from 'date-fns'
import StatusBadge from '@/components/ui/StatusBadge'
import { useBlockDates } from '@/components/availability/useBlockDates'
import { availabilityService, type AdminSession } from '@/services/availability.service'
import { bookingService } from '@/services/booking.service'
import { experienceService } from '@/services/experience.service'
import { money } from '@/services/refund.service'
import { formatLocalDate, timezoneLabel } from '@/utils/schedule'
import { formatTime12h } from '@/utils/time'

const today = () => format(new Date(), 'yyyy-MM-dd')

function SessionBookings({ experienceId, session }: { experienceId: string; session: AdminSession }) {
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'session', experienceId, session.starts_at],
    queryFn: () => bookingService.list({
      experience_id: experienceId,
      session_from: session.starts_at,
      session_to: session.starts_at,
      sort: 'created_desc',
      limit: 100,
    }),
  })
  if (isLoading) return <Spinner size="sm" />
  if (!data?.items.length) return <span className="text-muted small">No bookings.</span>
  return (
    <Table size="sm" className="mb-0 bg-white">
      <thead>
        <tr><th>Booking</th><th>Guests</th><th>Amount</th><th>Status</th><th>Payment</th><th>Booked</th></tr>
      </thead>
      <tbody>
        {data.items.map((b) => (
          <tr key={b.id}>
            <td className="font-monospace small">{b.id.slice(0, 8)}…</td>
            <td>{b.party_size ?? 1}</td>
            <td>{b.price_total != null ? money(b.price_total, b.currency) : '—'}</td>
            <td><StatusBadge status={b.status} /></td>
            <td><StatusBadge status={b.payment_status} /></td>
            <td className="small text-muted">{new Date(b.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default function ExperienceSessionsPage() {
  const { id } = useParams<{ id: string }>()
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(() => format(addDays(new Date(), 30), 'yyyy-MM-dd'))
  const [open, setOpen] = useState<string | null>(null)

  const { data: experience } = useQuery({
    queryKey: ['experience', id],
    queryFn: () => experienceService.get(id),
  })
  const { data, isLoading } = useQuery({
    queryKey: ['admin-sessions', id, from, to],
    queryFn: () => availabilityService.sessions(id, { from, to }),
    enabled: !!from && !!to && to >= from,
  })
  const { block, unblock, confirmModal } = useBlockDates(id)

  const blockSession = (s: AdminSession) => block.mutate({
    starts_on: s.local_date,
    start_time: s.local_time.slice(0, 5),
    reason: 'Session blocked in helm',
  })

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">Sessions</h4>
          <div className="text-muted small">
            {experience?.title}
            {data && ` · times in ${timezoneLabel(data.timezone)}`}
          </div>
        </div>
        <Link href={`/experiences/${id}/edit`} className="btn btn-sm btn-outline-secondary">Edit experience</Link>
      </div>

      <Card>
        <CardHeader>
          <Row className="g-2">
            <Col md={3}>
              <Form.Label className="small mb-0">From</Form.Label>
              <Form.Control type="date" size="sm" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small mb-0">To</Form.Label>
              <Form.Control type="date" size="sm" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
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
                  <th>Date</th>
                  <th>Time</th>
                  <th>Seats taken</th>
                  <th>Held</th>
                  <th>Left</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data?.sessions.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-muted py-4">No sessions in these dates</td></tr>
                )}
                {data?.sessions.map((s) => (
                  <Fragment key={s.starts_at}>
                    <tr className={`align-middle ${s.blocked ? 'table-secondary' : ''}`}>
                      <td>
                        {formatLocalDate(s.local_date)}
                        {s.end_local_date !== s.local_date && (
                          <div className="small text-muted">to {formatLocalDate(s.end_local_date)}</div>
                        )}
                      </td>
                      <td>{formatTime12h(s.local_time)}</td>
                      <td>{s.confirmed}{s.capacity != null && ` / ${s.capacity}`}</td>
                      <td>{s.held || '—'}</td>
                      <td>{s.seats_left ?? '—'}</td>
                      <td>
                        {s.bookings_count > 0 ? (
                          <Button
                            size="sm"
                            variant="link"
                            className="p-0"
                            onClick={() => setOpen(open === s.starts_at ? null : s.starts_at)}
                          >
                            {s.bookings_count} {open === s.starts_at ? '▴' : '▾'}
                          </Button>
                        ) : '0'}
                      </td>
                      <td>
                        {s.blocked && <Badge bg="secondary" className="me-1">Blocked</Badge>}
                        {!s.scheduled && <Badge bg="warning" text="dark" className="me-1">Off schedule</Badge>}
                        {!s.blocked && s.seats_left === 0 && <Badge bg="danger">Sold out</Badge>}
                      </td>
                      <td className="text-end">
                        {s.blocked ? (
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            title="Removes the block, including any other dates it covers"
                            disabled={unblock.isPending}
                            onClick={() => s.blackout_ids.forEach((b) => unblock.mutate(b))}
                          >
                            Unblock
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            disabled={block.isPending}
                            onClick={() => blockSession(s)}
                          >
                            Block
                          </Button>
                        )}
                      </td>
                    </tr>
                    {open === s.starts_at && (
                      <tr>
                        <td colSpan={8} className="bg-light">
                          <SessionBookings experienceId={id} session={s} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
      {confirmModal}
    </div>
  )
}
