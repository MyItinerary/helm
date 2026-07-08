'use client'

import {
  Card, CardBody, CardHeader, Col, Row, Spinner, Table,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDollarSign, faArrowUp, faClock,
} from '@fortawesome/free-solid-svg-icons'
import { useQuery } from '@tanstack/react-query'
import { paymentService } from '@/services/payment.service'
import StatusBadge from '@/components/ui/StatusBadge'

function SummaryCard({
  title, value, icon, color,
}: {
  title: string; value: string; icon: typeof faDollarSign; color: string
}) {
  return (
    <Card className="mb-4 border-start border-4" style={{ borderColor: `var(--bs-${color}) !important` }}>
      <CardBody>
        <Row className="align-items-center">
          <Col>
            <div className="text-muted small text-uppercase fw-semibold">{title}</div>
            <div className="fs-4 fw-bold">{value}</div>
          </Col>
          <Col xs="auto">
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center bg-${color} text-white`}
              style={{ width: 48, height: 48 }}
            >
              <FontAwesomeIcon icon={icon} />
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['payments-overview'],
    queryFn: () => paymentService.overview(),
  })

  const fmt = (n?: number) => (n != null ? `$${n.toLocaleString()}` : '—')

  return (
    <div>
      <h4 className="mb-4">Payments & Payouts</h4>

      <Row>
        <Col md={4}>
          <SummaryCard
            title="Total Revenue"
            value={fmt(data?.summary.total_revenue)}
            icon={faDollarSign}
            color="success"
          />
        </Col>
        <Col md={4}>
          <SummaryCard
            title="Pending Payouts"
            value={fmt(data?.summary.pending_payouts)}
            icon={faClock}
            color="warning"
          />
        </Col>
        <Col md={4}>
          <SummaryCard
            title="Completed Payouts"
            value={fmt(data?.summary.completed_payouts)}
            icon={faArrowUp}
            color="primary"
          />
        </Col>
      </Row>

      <Card>
        <CardHeader>Transactions</CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Transaction ID</th>
                  <th>Booking</th>
                  <th>Amount</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.transactions || data.transactions.length === 0) && (
                  <tr><td colSpan={6} className="text-center text-muted py-4">No transactions yet</td></tr>
                )}
                {data?.transactions.map((tx) => (
                  <tr key={tx.id} className="align-middle">
                    <td className="font-monospace small text-muted">{tx.id.slice(0, 8)}...</td>
                    <td className="small font-monospace">{tx.booking_id.slice(0, 8)}...</td>
                    <td>{`${tx.currency} ${tx.amount.toLocaleString()}`}</td>
                    <td>
                      <span className="badge bg-light text-dark text-capitalize">{tx.provider}</span>
                    </td>
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
