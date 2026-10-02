'use client'

import {
  Alert, Badge, Button, Col, Form, Modal, Row, Spinner, Table,
} from 'react-bootstrap'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  apiErrorDetail, CANCELLING_KINDS, KIND_LABEL, money, refundService,
  type RefundBookingSummary, type RefundDecision, type RefundRequest,
} from '@/services/refund.service'

type RefundMode = 'none' | 'full' | 'amount' | 'percent'

interface Props {
  show: boolean
  onHide: () => void
  // Deciding a request from the queue…
  request?: RefundRequest | null
  // …or refunding a booking directly (no request).
  bookingId?: string | null
}

function defaultMode(request?: RefundRequest | null): RefundMode {
  if (!request) return 'none'
  return ['curator_cancellation', 'oversold', 'duplicate_payment'].includes(request.kind) ? 'full' : 'none'
}

// The admin's refund decision. Every refund needs a written justification;
// the cancellation policy shown is the one the customer agreed to.
export default function RefundDecisionModal({ show, onHide, request, bookingId }: Props) {
  const targetBookingId = request?.booking_id ?? bookingId ?? ''
  const { data: fetched, isLoading } = useQuery({
    queryKey: ['refund-booking', targetBookingId],
    queryFn: () => refundService.booking(targetBookingId),
    enabled: show && !request?.booking && !!targetBookingId,
  })
  const booking: RefundBookingSummary | null | undefined = request?.booking ?? fetched

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {request ? `Review: ${KIND_LABEL[request.kind] ?? request.kind}` : 'Refund booking'}
        </Modal.Title>
      </Modal.Header>
      {!booking ? (
        <Modal.Body className="text-center py-5">
          {isLoading ? <Spinner animation="border" variant="primary" /> : 'Booking not found.'}
        </Modal.Body>
      ) : (
        <DecisionForm key={`${request?.id ?? ''}-${booking.id}`} request={request} booking={booking} onDone={onHide} />
      )}
    </Modal>
  )
}

function DecisionForm({
  request, booking, onDone,
}: {
  request?: RefundRequest | null
  booking: RefundBookingSummary
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const currency = booking.currency ?? 'NGN'
  const paid = Number(booking.price_total ?? 0)
  const refundedSoFar = Number(booking.refunded_amount ?? 0)
  const refundable = Math.max(paid - refundedSoFar, 0)
  const isChargeRequest = request?.kind === 'duplicate_payment'

  const [mode, setMode] = useState<RefundMode>(defaultMode(request))
  const [amount, setAmount] = useState('')
  const [percent, setPercent] = useState('')
  const [guideShare, setGuideShare] = useState('')
  const [cancelBooking, setCancelBooking] = useState(
    request ? CANCELLING_KINDS.includes(request.kind) : false,
  )
  const [notes, setNotes] = useState('')

  const refundNow = mode === 'full' ? refundable
    : mode === 'amount' ? Number(amount || 0)
      : mode === 'percent' ? (paid * Number(percent || 0)) / 100
        : 0
  const keptFraction = paid > 0 ? Math.max(paid - refundedSoFar - refundNow, 0) / paid : 0
  const proportionalShare = Math.round(keptFraction * 10000) / 100
  const fullEarnings = Number(booking.guide_earnings_amount ?? 0)
  const tooMuch = !isChargeRequest && refundNow > refundable + 0.001

  const decision = (): RefundDecision => {
    const d: RefundDecision = { admin_notes: notes.trim() }
    if (mode === 'full') {
      if (isChargeRequest) d.user_refund_percentage = '100'
      else d.refund_amount = refundable.toFixed(2)
    }
    if (mode === 'amount') d.refund_amount = amount
    if (mode === 'percent') d.user_refund_percentage = percent
    if (!isChargeRequest && guideShare !== '') d.experience_host_refund_percentage = guideShare
    if (!isChargeRequest) d.cancel_booking = cancelBooking
    return d
  }

  const { mutate, isPending } = useMutation({
    mutationFn: () => (request
      ? refundService.resolve(request.id, decision())
      : refundService.refundBooking(booking.id, decision())),
    onSuccess: () => {
      toast.success(refundNow > 0 ? `Refunded ${money(refundNow, currency)}` : 'Decision saved')
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] })
      queryClient.invalidateQueries({ queryKey: ['refund-booking', booking.id] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      onDone()
    },
    onError: (error) => toast.error(apiErrorDetail(error, 'Could not save the decision')),
  })

  const session = booking.requested_datetime
    ? new Date(booking.requested_datetime).toLocaleString()
    : 'No date'

  return (
    <>
      <Modal.Body>
        <Row className="g-3 mb-3 small">
          <Col md={6}>
            <div className="text-muted">Customer</div>
            <div>{booking.customer_email ?? '—'}</div>
          </Col>
          <Col md={6}>
            <div className="text-muted">Experience</div>
            <div>{booking.experience_title ?? '—'} · {session}</div>
          </Col>
          <Col md={3}>
            <div className="text-muted">Paid</div>
            <div className="fw-semibold">{money(paid, currency)}</div>
          </Col>
          <Col md={3}>
            <div className="text-muted">Checkout fee</div>
            <div>{money(booking.checkout_fee_amount, currency)}</div>
          </Col>
          <Col md={3}>
            <div className="text-muted">Refunded so far</div>
            <div>{money(refundedSoFar, currency)}</div>
          </Col>
          <Col md={3}>
            <div className="text-muted">Curator earnings now</div>
            <div>{money(fullEarnings, currency)}</div>
          </Col>
        </Row>

        {request?.reason && (
          <Alert variant="light" className="small mb-3">
            <strong>Reason ({request.requested_by}):</strong> {request.reason}
          </Alert>
        )}

        <div className="mb-3">
          <div className="small text-muted mb-1">Cancellation policy agreed at booking</div>
          <blockquote className="border-start border-3 ps-3 small mb-0" style={{ whiteSpace: 'pre-line' }}>
            {booking.cancellation_policy_snapshot || <span className="fst-italic text-muted">No written policy.</span>}
          </blockquote>
        </div>

        {booking.refunds.length > 0 && (
          <Table size="sm" className="small">
            <thead><tr><th>Earlier refund</th><th>Amount</th><th>Justification</th></tr></thead>
            <tbody>
              {booking.refunds.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>{money(r.amount, r.currency)}</td>
                  <td>{r.justification}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {isChargeRequest && (
          <Alert variant="warning" className="small">
            This is a second charge on a booking that was already paid. Refunding it doesn&apos;t change the booking or the curator&apos;s payout.
          </Alert>
        )}

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Refund to the customer</Form.Label>
          <div className="d-flex flex-wrap gap-3">
            <Form.Check type="radio" id="mode-none" label="No refund" checked={mode === 'none'} onChange={() => setMode('none')} />
            <Form.Check
              type="radio"
              id="mode-full"
              label={isChargeRequest ? 'Refund this charge in full' : `Full: ${money(refundable, currency)}`}
              checked={mode === 'full'}
              onChange={() => setMode('full')}
            />
            <Form.Check type="radio" id="mode-amount" label="Amount" checked={mode === 'amount'} onChange={() => setMode('amount')} />
            <Form.Check type="radio" id="mode-percent" label="% of what was paid" checked={mode === 'percent'} onChange={() => setMode('percent')} />
          </div>
          {mode === 'amount' && (
            <Form.Control className="mt-2" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Up to ${refundable.toFixed(2)}`} />
          )}
          {mode === 'percent' && (
            <Form.Control className="mt-2" type="number" min={0} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="e.g. 50" />
          )}
          {tooMuch && <Form.Text className="text-danger">Only {money(refundable, currency)} can still be refunded.</Form.Text>}
          {refundNow > 0 && !isChargeRequest && (
            <Form.Text className="text-muted d-block">
              Includes the checkout fee in proportion; MyJourny covers the part the payment provider keeps.
            </Form.Text>
          )}
        </Form.Group>

        {!isChargeRequest && (
          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label className="fw-semibold">Curator keeps (% of earnings)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                max={100}
                value={guideShare}
                onChange={(e) => setGuideShare(e.target.value)}
                placeholder={`${proportionalShare}% (in proportion)`}
              />
              <Form.Text className="text-muted">
                ≈ {money((fullEarnings * Number(guideShare === '' ? proportionalShare : guideShare)) / 100, currency)}, paid 24h after the session.
              </Form.Text>
            </Col>
            <Col md={6} className="d-flex align-items-center">
              <Form.Check
                type="switch"
                id="cancel-booking"
                label="Cancel the booking (frees its seats)"
                checked={cancelBooking}
                onChange={(e) => setCancelBooking(e.target.checked)}
              />
            </Col>
          </Row>
        )}

        <Form.Group>
          <Form.Label className="fw-semibold">Justification <Badge bg="danger">required</Badge></Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Cancelled 3 days before: 50% under the policy"
          />
          <Form.Text className="text-muted">Saved with the refund in the audit log. At least 10 characters.</Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onDone}>Cancel</Button>
        <Button
          variant={refundNow > 0 ? 'danger' : 'primary'}
          disabled={notes.trim().length < 10 || tooMuch || isPending || (mode === 'amount' && !amount) || (mode === 'percent' && !percent)}
          onClick={() => mutate()}
        >
          {isPending ? <Spinner size="sm" /> : refundNow > 0 ? `Refund ${money(refundNow, currency)}` : 'Save decision'}
        </Button>
      </Modal.Footer>
    </>
  )
}
