'use client'

import {
  Card, CardBody, CardHeader, Col, Row, Spinner, Table,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers, faCompass, faCalendarCheck, faDollarSign,
  faArrowUp, faArrowDown, faCheckCircle,
} from '@fortawesome/free-solid-svg-icons'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/admin.service'
import { guideService } from '@/services/guide.service'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'

function StatsCard({
  title, value, icon, color, trend,
}: {
  title: string
  value: string | number
  icon: typeof faUsers
  color: string
  trend?: { value: string; up: boolean }
}) {
  return (
    <Card bg={color} text="white" className="mb-4">
      <CardBody className="pb-0 d-flex justify-content-between align-items-start">
        <div>
          <div className="fs-4 fw-semibold">
            {value}
            {trend && (
              <span className="fs-6 ms-2 fw-normal opacity-75">
                ({trend.value}
                <FontAwesomeIcon icon={trend.up ? faArrowUp : faArrowDown} className="ms-1" />
                )
              </span>
            )}
          </div>
          <div className="small opacity-75">{title}</div>
        </div>
        <FontAwesomeIcon icon={icon} size="2x" className="opacity-50 mt-1" />
      </CardBody>
      <CardBody className="pt-2" />
    </Card>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminService.getStats,
  })

  const { data: pending } = useQuery({
    queryKey: ['guides-unverified'],
    queryFn: guideService.listUnverified,
  })

  if (statsLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  const formatCurrency = (n?: number) => (n != null ? `$${n.toLocaleString()}` : '—')

  return (
    <div>
      <h4 className="mb-4">Dashboard</h4>

      <Row>
        <Col sm={6} lg={3}>
          <StatsCard
            title="Total Users"
            value={stats?.total_users ?? '—'}
            icon={faUsers}
            color="primary"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatsCard
            title="Total Hosts"
            value={stats?.total_guides ?? '—'}
            icon={faCompass}
            color="info"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatsCard
            title="Active Bookings"
            value={stats?.active_bookings ?? '—'}
            icon={faCalendarCheck}
            color="warning"
          />
        </Col>
        <Col sm={6} lg={3}>
          <StatsCard
            title="Monthly Revenue"
            value={formatCurrency(stats?.monthly_revenue)}
            icon={faDollarSign}
            color="success"
          />
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <CardHeader className="d-flex justify-content-between align-items-center">
              <span>
                <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-warning" />
                Pending Verifications
              </span>
              <Link href="/guides?tab=unverified" className="btn btn-sm btn-outline-primary">
                View all
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {!pending || pending.length === 0 ? (
                <p className="text-muted text-center py-4 mb-0">No pending verifications</p>
              ) : (
                <Table hover responsive className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Guide</th>
                      <th>Document</th>
                      <th>Submitted</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.slice(0, 5).map((v) => (
                      <tr key={v.id}>
                        <td>{v.guide_id}</td>
                        <td>{v.document_type}</td>
                        <td>{new Date(v.created_at).toLocaleDateString()}</td>
                        <td><StatusBadge status={v.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <CardHeader>Quick Links</CardHeader>
            <CardBody>
              <div className="d-grid gap-2">
                <Link href="/users" className="btn btn-outline-primary">
                  <FontAwesomeIcon icon={faUsers} className="me-2" />
                  Manage Users
                </Link>
                <Link href="/guides" className="btn btn-outline-info">
                  <FontAwesomeIcon icon={faCompass} className="me-2" />
                  Manage Hosts / Curators
                </Link>
                <Link href="/bookings" className="btn btn-outline-warning">
                  <FontAwesomeIcon icon={faCalendarCheck} className="me-2" />
                  View Bookings
                </Link>
                <Link href="/payments" className="btn btn-outline-success">
                  <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                  Payments & Payouts
                </Link>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
