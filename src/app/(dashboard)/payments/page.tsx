'use client'

import {
  Alert, Badge, ButtonGroup, Button, Card, CardBody, CardHeader, Col, Row, Spinner, Table,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowDown, faArrowUp, faBuildingColumns, faCoins, faHandHoldingDollar, faRotateLeft,
} from '@fortawesome/free-solid-svg-icons'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { money, paymentService } from '@/services/payment.service'
import StatusBadge from '@/components/ui/StatusBadge'

const CURRENCIES = ['NGN', 'USD', 'GBP']

function SummaryCard({
  title, value, hint, icon, color,
}: {
  title: string; value: string; hint?: string; icon: typeof faCoins; color: string
}) {
  return (
    <Card className="mb-4 h-100">
      <CardBody>
        <Row className="align-items-center">
          <Col>
            <div className="text-muted small text-uppercase fw-semibold">{title}</div>
            <div className="fs-4 fw-bold">{value}</div>
            {hint && <div className="small text-muted">{hint}</div>}
          </Col>
          <Col xs="auto">
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center bg-${color} text-white`}
              style={{ width: 44, height: 44 }}
            >
              <FontAwesomeIcon icon={icon} />
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

// Payments & payouts, read from itin's ledger. Every figure is for one
// currency: NGN and USD bookings are never added together.
export default function PaymentsPage() {
  const [currency, setCurrency] = useState('NGN')
  const summary = useQuery({ queryKey: ['finance-summary', currency], queryFn: () => paymentService.summary(currency) })
  const curators = useQuery({ queryKey: ['finance-curators', currency], queryFn: () => paymentService.curators(currency) })
  const unmatched = useQuery({ queryKey: ['finance-unmatched'], queryFn: paymentService.unmatched })
  const transactions = useQuery({ queryKey: ['payments-overview'], queryFn: () => paymentService.overview({ limit: 20 }) })

  const s = summary.data
  const fmt = (n?: string | number | null) => (n != null ? money(n, currency) : '—')

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="mb-0">Payments &amp; Payouts</h4>
        <ButtonGroup size="sm">
          {CURRENCIES.map((c) => (
            <Button key={c} variant={c === currency ? 'primary' : 'outline-primary'} onClick={() => setCurrency(c)}>{c}</Button>
          ))}
        </ButtonGroup>
      </div>

      {s && (s.unmatched_payments > 0 || s.open_refund_requests > 0) && (
        <Alert variant="warning" className="d-flex gap-4 flex-wrap">
          {s.unmatched_payments > 0 && (
            <span><strong>{s.unmatched_payments}</strong> payment{s.unmatched_payments === 1 ? '' : 's'} couldn&apos;t be matched to a booking (see below).</span>
          )}
          {s.open_refund_requests > 0 && (
            <span>
              <strong>{s.open_refund_requests}</strong> refund request{s.open_refund_requests === 1 ? '' : 's'} waiting. <Link href="/refunds">Review</Link>
            </span>
          )}
        </Alert>
      )}

      {summary.isLoading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : (
        <Row className="g-3 mb-2">
          <Col md={4}><SummaryCard title="Collected" value={fmt(s?.collected)} hint="After the provider's checkout fee" icon={faArrowDown} color="success" /></Col>
          <Col md={4}><SummaryCard title="MyJourny commission" value={fmt(s?.commission)} hint="After refunds and funded promos" icon={faCoins} color="primary" /></Col>
          <Col md={4}><SummaryCard title="Refunded" value={fmt(s?.refunded)} icon={faRotateLeft} color="secondary" /></Col>
          <Col md={4}><SummaryCard title="Owed to curators" value={fmt(s?.owed_to_curators)} hint="Paid 24h after each session" icon={faHandHoldingDollar} color="warning" /></Col>
          <Col md={4}><SummaryCard title="Paid to curators" value={fmt(s?.paid_to_curators)} icon={faArrowUp} color="info" /></Col>
          <Col md={4}>
            <SummaryCard
              title="Expected provider balance"
              value={fmt(s?.provider_balance)}
              hint={`Held for customers ${fmt(s?.held_for_customers)} · owed by curators ${fmt(s?.owed_by_curators)}`}
              icon={faBuildingColumns}
              color="dark"
            />
          </Col>
        </Row>
      )}

      <Card className="mb-4">
        <CardHeader>Curator balances</CardHeader>
        <CardBody className="p-0">
          {curators.isLoading ? (
            <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Curator</th>
                  <th>Owed to curator</th>
                  <th>Curator owes</th>
                  <th>Paid out</th>
                  <th>Bookings awaiting payout</th>
                </tr>
              </thead>
              <tbody>
                {curators.data?.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted py-4">No curator activity in {currency} yet</td></tr>
                )}
                {curators.data?.map((c) => (
                  <tr key={c.guide_id}>
                    <td>
                      <div>{c.name ?? 'Unnamed curator'}</div>
                      <div className="small text-muted">{c.email}</div>
                    </td>
                    <td className="fw-semibold">{fmt(c.owed_to_curator)}</td>
                    <td>
                      {Number(c.owed_by_curator) > 0
                        ? <Badge bg="danger">{fmt(c.owed_by_curator)}</Badge>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td>{fmt(c.paid_out)}</td>
                    <td>{c.bookings_awaiting_payout}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
        <div className="card-footer small text-muted">
          &quot;Curator owes&quot; is money refunded after the curator was paid; it&apos;s deducted from their next payouts automatically.
        </div>
      </Card>

      {(unmatched.data?.length ?? 0) > 0 && (
        <Card className="mb-4 border-warning">
          <CardHeader className="bg-warning-subtle">Payments that need reconciling</CardHeader>
          <CardBody className="p-0">
            <Table responsive className="mb-0 align-middle small">
              <thead className="table-light">
                <tr><th>Provider</th><th>Reference</th><th>Amount</th><th>Problem</th><th>Received</th></tr>
              </thead>
              <tbody>
                {unmatched.data?.map((u) => (
                  <tr key={u.id}>
                    <td className="text-capitalize">{u.provider}</td>
                    <td className="font-monospace">{u.reference ?? '—'}</td>
                    <td>{u.amount != null ? money(u.amount, u.currency) : '—'}</td>
                    <td>{u.status === 'unmatched' ? 'No matching booking' : "Amount doesn't match the booking"}</td>
                    <td>{new Date(u.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
          <div className="card-footer small text-muted">
            These customers have paid. Find the booking (or refund them) in the provider&apos;s dashboard.
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>Recent payments</CardHeader>
        <CardBody className="p-0">
          {transactions.isLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Reference</th>
                  <th>Booking</th>
                  <th>Amount</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(transactions.data?.transactions.length ?? 0) === 0 && (
                  <tr><td colSpan={6} className="text-center text-muted py-4">No payments yet</td></tr>
                )}
                {transactions.data?.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-monospace small text-muted">{tx.external_payment_id ?? tx.id}</td>
                    <td className="small font-monospace">{tx.booking_id ? `${tx.booking_id.slice(0, 8)}…` : '—'}</td>
                    <td>{money(tx.amount, tx.currency)}</td>
                    <td><span className="badge bg-light text-dark text-capitalize">{tx.provider ?? '—'}</span></td>
                    <td><StatusBadge status={tx.status} /></td>
                    <td className="text-muted small">{new Date(tx.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
