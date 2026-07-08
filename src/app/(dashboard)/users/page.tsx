'use client'

import {
  Card, CardBody, CardHeader, Col, Form, Row, Spinner, Table,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faPencil } from '@fortawesome/free-solid-svg-icons'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { userService } from '@/services/user.service'
import StatusBadge from '@/components/ui/StatusBadge'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => userService.list({ page, limit, search: search || undefined }),
  })

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Users</h4>
        <small className="text-muted">{data?.total ?? 0} total</small>
      </div>

      <Card>
        <CardHeader>
          <Row className="align-items-center">
            <Col md={4}>
              <div className="input-group">
                <span className="input-group-text">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <Form.Control
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
            </Col>
          </Row>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Email</th>
                  <th>Signup Type</th>
                  <th>Email Verified</th>
                  <th>Joined</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">No users found</td>
                  </tr>
                )}
                {data?.items.map((user) => (
                  <tr key={user.id} className="align-middle">
                    <td>{user.email}</td>
                    <td>
                      <span className="badge bg-light text-dark text-capitalize">{user.signup_type}</span>
                    </td>
                    <td>
                      <StatusBadge status={user.is_email_verified ? 'verified' : 'unverified'} />
                    </td>
                    <td className="text-muted small">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          title="Edit"
                          onClick={() => {}}
                        >
                          <FontAwesomeIcon icon={faPencil} />
                        </button>
                      </div>
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
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page * limit >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
