'use client'

import {
  Badge, Button, Card, CardBody, CardHeader, Col, Form, Modal, Row, Spinner, Table,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch, faPlus, faXmark, faEye, faPencil, faCalendarDays,
} from '@fortawesome/free-solid-svg-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { experienceService } from '@/services/experience.service'
import ExperienceDetails from '@/components/experiences/ExperienceDetails'
import StatusBadge from '@/components/ui/StatusBadge'
import { describeMissing, missingFromError } from '@/utils/publish'
import { formatPriceFrom } from '@/utils/schedule'

// Not a status the API stores: live host listings no admin has checked.
const UNREVIEWED = 'UNREVIEWED'

function ViewExperienceModal({ experienceId, onClose }: { experienceId: string | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['experience', experienceId],
    queryFn: () => experienceService.get(experienceId as string),
    enabled: !!experienceId,
  })

  return (
    <Modal show={!!experienceId} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{data?.title ?? 'Experience'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
        ) : !data ? (
          <p className="text-muted mb-0">Not found.</p>
        ) : (
          <ExperienceDetails data={data} />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default function ExperiencesPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const limit = 20
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['experiences', page, statusFilter, search],
    queryFn: () => experienceService.list({
      page,
      limit,
      status: statusFilter && statusFilter !== UNREVIEWED ? statusFilter : undefined,
      unreviewed: statusFilter === UNREVIEWED || undefined,
      search: search || undefined,
    }),
  })

  const commitSearch = () => { setSearch(searchInput); setPage(1) }
  const clearSearch = () => { setSearchInput(''); setSearch(''); setPage(1) }

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => experienceService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated')
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
    },
    onError: (error) => {
      const missing = missingFromError(error)
      toast.error(missing ? `Add these before publishing: ${describeMissing(missing)}` : 'Update failed')
    },
  })

  const nextStatus = (current: string): 'ACTIVE' | 'INACTIVE' => (current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Experiences</h4>
        <div className="d-flex align-items-center gap-3">
          <small className="text-muted">{data?.total ?? 0} total</small>
          <Link href="/experiences/new" className="btn btn-primary btn-sm">
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            Create Experience
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Row className="align-items-center gap-2">
            <Col md={4}>
              <div className="input-group">
                <span className="input-group-text"><FontAwesomeIcon icon={faSearch} /></span>
                <Form.Control
                  placeholder="Search by title... (press Enter)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitSearch() } }}
                />
                {searchInput && (
                  <button type="button" className="btn btn-outline-secondary" onClick={clearSearch} aria-label="Clear search">
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                )}
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
                <option value={UNREVIEWED}>Not reviewed yet</option>
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
                      <Link href={`/experiences/${exp.id}`} className="fw-semibold">{exp.title}</Link>
                      {exp.interest_tags && exp.interest_tags.length > 0 && (
                        <div className="small text-muted">{exp.interest_tags.slice(0, 2).join(', ')}</div>
                      )}
                    </td>
                    <td className="text-muted small">{exp.guide?.display_name ?? exp.guide_id}</td>
                    <td>{[exp.city, exp.country].filter(Boolean).join(', ') || '—'}</td>
                    <td>{formatPriceFrom(exp)}</td>
                    <td>
                      <StatusBadge status={exp.status} />
                      {exp.status === 'ACTIVE' && !exp.reviewed_at && (
                        <Badge bg="info" className="ms-1">Not reviewed</Badge>
                      )}
                      {!!exp.missing_for_publish?.length && (
                        <Badge bg="warning" text="dark" className="ms-1" title={describeMissing(exp.missing_for_publish)}>
                          Needs details
                        </Badge>
                      )}
                    </td>
                    <td className="text-muted small">{new Date(exp.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          title="View"
                          onClick={() => setViewingId(exp.id)}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <Link href={`/experiences/${exp.id}/edit`} className="btn btn-sm btn-outline-secondary" title="Edit">
                          <FontAwesomeIcon icon={faPencil} />
                        </Link>
                        <Link href={`/experiences/${exp.id}/sessions`} className="btn btn-sm btn-outline-secondary" title="Sessions and seats">
                          <FontAwesomeIcon icon={faCalendarDays} />
                        </Link>
                        <button
                          type="button"
                          className={`btn btn-sm ${exp.status === 'ACTIVE' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          onClick={() => toggleStatus({ id: exp.id, status: nextStatus(exp.status) })}
                        >
                          {exp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page * limit >= data.total} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </Card>

      <ViewExperienceModal experienceId={viewingId} onClose={() => setViewingId(null)} />
    </div>
  )
}
