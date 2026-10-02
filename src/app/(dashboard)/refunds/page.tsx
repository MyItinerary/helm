'use client'

import {
  Badge, Button, Card, CardBody, CardHeader, Form, Nav, Spinner, Table,
} from 'react-bootstrap'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import RefundDecisionModal from '@/components/refunds/RefundDecisionModal'
import {
  KIND_LABEL, money, refundService, type RefundRequest,
} from '@/services/refund.service'

const KIND_VARIANT: Record<string, string> = {
  customer_cancellation: 'primary',
  curator_cancellation: 'warning',
  dispute: 'danger',
  admin_refund: 'secondary',
  oversold: 'dark',
  duplicate_payment: 'info',
}

// The refund queue: every cancellation, dispute and system-flagged payment
// waits here for an admin decision with a justification.
export default function RefundsPage() {
  const [tab, setTab] = useState<'open' | 'resolved'>('open')
  const [kind, setKind] = useState('')
  const [reviewing, setReviewing] = useState<RefundRequest | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['refund-requests', tab, kind],
    queryFn: () => refundService.queue({ status: tab, kind: kind || undefined }),
  })

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Refunds &amp; cancellations</h4>
        {tab === 'open' && data && <Badge bg={data.length ? 'danger' : 'success'}>{data.length} waiting</Badge>}
      </div>

      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <Nav variant="tabs" activeKey={tab} onSelect={(k) => setTab((k as 'open' | 'resolved') ?? 'open')} className="border-0">
            <Nav.Item><Nav.Link eventKey="open">Waiting for a decision</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="resolved">Decided</Nav.Link></Nav.Item>
          </Nav>
          <Form.Select size="sm" style={{ maxWidth: 240 }} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All kinds</option>
            {Object.entries(KIND_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Form.Select>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Kind</th>
                  <th>Customer</th>
                  <th>Experience &amp; session</th>
                  <th>Paid</th>
                  {tab === 'open' ? <th>Reason</th> : <th>Refunded</th>}
                  <th>{tab === 'open' ? 'Requested' : 'Decided'}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      {tab === 'open' ? 'Nothing waiting. 🎉' : 'No decisions yet.'}
                    </td>
                  </tr>
                )}
                {data?.map((r) => {
                  const b = r.booking
                  return (
                    <tr key={r.id}>
                      <td><Badge bg={KIND_VARIANT[r.kind] ?? 'secondary'}>{KIND_LABEL[r.kind] ?? r.kind}</Badge></td>
                      <td className="small">{b?.customer_email ?? '—'}</td>
                      <td className="small">
                        <div>{b?.experience_title ?? '—'}</div>
                        <div className="text-muted">
                          {b?.requested_datetime ? new Date(b.requested_datetime).toLocaleString() : 'No date'}
                        </div>
                      </td>
                      <td>{money(b?.price_total, b?.currency)}</td>
                      {tab === 'open' ? (
                        <td className="small text-truncate" style={{ maxWidth: 260 }} title={r.reason ?? ''}>{r.reason}</td>
                      ) : (
                        <td>
                          <div>{money(r.refund_amount, b?.currency)}</div>
                          <div className="small text-muted text-truncate" style={{ maxWidth: 260 }} title={r.admin_notes ?? ''}>{r.admin_notes}</div>
                        </td>
                      )}
                      <td className="small text-muted">
                        {new Date((tab === 'open' ? r.created_at : r.resolved_at) ?? r.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-end">
                        {tab === 'open' && (
                          <Button size="sm" variant="primary" onClick={() => setReviewing(r)}>Review</Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <RefundDecisionModal show={!!reviewing} request={reviewing} onHide={() => setReviewing(null)} />
    </div>
  )
}
