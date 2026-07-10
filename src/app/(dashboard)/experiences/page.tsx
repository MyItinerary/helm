'use client'

import {
  Card, CardBody, CardHeader, Col, Form, Row, Spinner, Table,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { experienceService } from '@/services/experience.service'
import StatusBadge from '@/components/ui/StatusBadge'

export default function ExperiencesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['experiences', page, statusFilter],
    queryFn: () => experienceService.list({ page, limit, status: statusFilter || undefined }),
  })

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => experienceService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated')
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
    },
    onError: () => toast.error('Update failed'),
  })

  const nextStatus = (current: string): 'ACTIVE' | 'INACTIVE' => (current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Experiences</h4>
        <small className="text-muted">{data?.total ?? 0} total</small>
      </div>

      <Card>
        <CardHeader>
          <Row className="align-items-center gap-2">
            <Col md={4}>
              <div className="input-group">
                <span className="input-group-text"><FontAwesomeIcon icon={faSearch} /></span>
                <Form.Control
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
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
                  <th>Title</th>
                  <th>Guide</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data?.items.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted py-4">No experiences found</td></tr>
                )}
                {data?.items.map((exp) => (
                  <tr key={exp.id} className="align-middle">
                    <td>
                      <div className="fw-semibold">{exp.title}</div>
                      {exp.tags && exp.tags.length > 0 && (
                        <div className="small text-muted">{exp.tags.slice(0, 2).join(', ')}</div>
                      )}
                    </td>
                    <td className="text-muted small">{exp.guide?.display_name ?? exp.guide_id}</td>
                    <td>{[exp.city, exp.country].filter(Boolean).join(', ') || exp.location || '—'}</td>
                    <td>{exp.price != null ? `$${exp.price}` : '—'}</td>
                    <td><StatusBadge status={exp.status} /></td>
                    <td className="text-muted small">{new Date(exp.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-sm ${exp.status === 'ACTIVE' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => toggleStatus({ id: exp.id, status: nextStatus(exp.status) })}
                      >
                        {exp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
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
