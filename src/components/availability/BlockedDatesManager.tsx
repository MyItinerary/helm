'use client'

import {
  Badge, Button, Card, CardBody, Col, Form, Row, Spinner, Table,
} from 'react-bootstrap'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import TimeInput from '@/components/experiences/TimeInput'
import { availabilityService, type Blackout } from '@/services/availability.service'
import { formatLocalDate } from '@/utils/schedule'
import { formatTime12h } from '@/utils/time'
import { useBlockDates } from './useBlockDates'

const SOURCE_LABELS: Record<Blackout['source'], string> = {
  admin: 'Admin',
  guide: 'Curator',
  session_cancel: 'Session cancelled',
}

const emptyBlock = {
  starts_on: '', ends_on: '', wholeDay: true, start_time: '', reason: '',
}

/** Dates (or one session time) an experience doesn't run, on its edit page. */
export default function BlockedDatesManager({ experienceId }: { experienceId: string }) {
  const [draft, setDraft] = useState(emptyBlock)
  const { data: blocks, isLoading } = useQuery({
    queryKey: ['blackouts', experienceId],
    queryFn: () => availabilityService.blocks(experienceId),
  })
  const { block, unblock, confirmModal } = useBlockDates(experienceId, () => setDraft(emptyBlock))

  const canAdd = draft.starts_on && (draft.wholeDay || draft.start_time)
    && (!draft.ends_on || draft.ends_on >= draft.starts_on)
  const add = () => block.mutate({
    starts_on: draft.starts_on,
    ends_on: draft.ends_on || undefined,
    start_time: draft.wholeDay ? undefined : draft.start_time,
    reason: draft.reason.trim() || undefined,
  })

  return (
    <Card className="mt-4">
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h6 className="text-uppercase text-muted small mb-0">Blocked dates</h6>
          <Link href={`/experiences/${experienceId}/sessions`} className="small">View sessions and seats</Link>
        </div>
        <p className="text-muted small">
          Blocked sessions aren&apos;t shown to customers and can&apos;t be booked. Dates are in the experience&apos;s
          time zone. A whole-day block also stops sessions that run over several days from running through it.
        </p>

        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <Table size="sm" className="mb-3">
            <thead>
              <tr>
                <th>Dates</th>
                <th>Session</th>
                <th>Reason</th>
                <th>By</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {blocks?.length === 0 && (
                <tr><td colSpan={5} className="text-muted">No upcoming blocked dates.</td></tr>
              )}
              {blocks?.map((b) => (
                <tr key={b.id} className="align-middle">
                  <td>
                    {formatLocalDate(b.starts_on)}
                    {b.ends_on !== b.starts_on && ` – ${formatLocalDate(b.ends_on)}`}
                  </td>
                  <td>{b.start_time ? formatTime12h(b.start_time) : 'Whole day'}</td>
                  <td className="small">{b.reason || '—'}</td>
                  <td><Badge bg="light" text="dark">{SOURCE_LABELS[b.source] ?? b.source}</Badge></td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      disabled={unblock.isPending}
                      onClick={() => unblock.mutate(b.id)}
                    >
                      Unblock
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <Row className="g-2 align-items-end">
          <Col md={3}>
            <Form.Label className="small">From</Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={draft.starts_on}
              onChange={(e) => setDraft((d) => ({ ...d, starts_on: e.target.value }))}
            />
          </Col>
          <Col md={3}>
            <Form.Label className="small">To (optional)</Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={draft.ends_on}
              min={draft.starts_on || undefined}
              onChange={(e) => setDraft((d) => ({ ...d, ends_on: e.target.value }))}
            />
          </Col>
          <Col md={6}>
            <Form.Check
              type="switch"
              id="block-whole-day"
              label="Whole day"
              checked={draft.wholeDay}
              onChange={(e) => setDraft((d) => ({ ...d, wholeDay: e.target.checked }))}
            />
            {!draft.wholeDay && (
              <div className="mt-1">
                <TimeInput value={draft.start_time} onChange={(next) => setDraft((d) => ({ ...d, start_time: next }))} />
                <Form.Text className="text-muted">Only the session starting at this time.</Form.Text>
              </div>
            )}
          </Col>
          <Col md={9}>
            <Form.Label className="small">Reason (optional)</Form.Label>
            <Form.Control
              size="sm"
              maxLength={500}
              value={draft.reason}
              placeholder="e.g. Venue closed for a private event"
              onChange={(e) => setDraft((d) => ({ ...d, reason: e.target.value }))}
            />
          </Col>
          <Col md={3} className="text-end">
            <Button size="sm" disabled={!canAdd || block.isPending} onClick={add}>
              {block.isPending ? <Spinner size="sm" /> : 'Block'}
            </Button>
          </Col>
        </Row>
      </CardBody>
      {confirmModal}
    </Card>
  )
}
