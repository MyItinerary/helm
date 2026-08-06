'use client'

import {
  Badge, Button, Card, CardBody, CardHeader, Col, Form, Modal, Row, Spinner, Table,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch, faPlus, faXmark, faEye, faPencil,
} from '@fortawesome/free-solid-svg-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { experienceService } from '@/services/experience.service'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatRecurrenceSummary } from '@/utils/recurrence'

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
          <>
            <h6 className="text-uppercase text-muted small mb-2">Basic Info</h6>
            <Row className="mb-2">
              <Col md={8}><strong>Headline:</strong> {data.headline || '—'}</Col>
              <Col md={4}>
                <StatusBadge status={data.status} />
                {data.is_featured && <Badge bg="warning" className="ms-2">Featured</Badge>}
              </Col>
            </Row>
            <p className="text-muted">{data.description || 'No description'}</p>

            <h6 className="text-uppercase text-muted small mb-2 mt-3">Location</h6>
            <p className="mb-3">
              {[data.city, data.country].filter(Boolean).join(', ') || '—'}
              {data.latitude != null && data.longitude != null && ` (${data.latitude}, ${data.longitude})`}
            </p>

            <h6 className="text-uppercase text-muted small mb-2 mt-3">Schedule</h6>
            <p className="mb-3">
              {!data.schedule_type && 'Not scheduled (bookable anytime)'}
              {data.schedule_type === 'one_off' && (
                <>
                  One-off: {data.event_start_date}
                  {data.event_end_date && ` – ${data.event_end_date}`}
                  {data.start_time && ` at ${data.start_time}`}
                </>
              )}
              {data.schedule_type === 'recurring' && (
                data.recurrence_type ? formatRecurrenceSummary(data) : 'Recurring — no pattern set'
              )}
            </p>

            <h6 className="text-uppercase text-muted small mb-2 mt-3">Pricing &amp; Logistics</h6>
            <Row className="mb-3">
              <Col md={4}>
                <strong>Price from:</strong>{' '}
                {data.price_from != null ? `${data.currency ?? 'USD'} ${data.price_from}` : '—'}
              </Col>
              <Col md={4}><strong>Duration:</strong> {data.duration_minutes ?? '—'} min</Col>
              <Col md={4}><strong>Group size:</strong> {data.group_size_min ?? '—'}–{data.group_size_max ?? '—'}</Col>
            </Row>

            <h6 className="text-uppercase text-muted small mb-2 mt-3">Experience Tags</h6>
            <Row className="mb-3">
              <Col md={6}><strong>Interests:</strong> {data.interest_tags?.join(', ') || '—'}</Col>
              <Col md={6}><strong>Social style:</strong> {data.social_style?.join(', ') || '—'}</Col>
              <Col md={4}><strong>Energy:</strong> {data.energy_level ?? '—'}</Col>
              <Col md={4}><strong>Budget:</strong> {data.budget_range ?? '—'}</Col>
              <Col md={4}><strong>Comfort:</strong> {data.comfort_level ?? '—'}</Col>
              <Col md={12}><strong>Time of day:</strong> {data.time_of_day ?? '—'}</Col>
            </Row>

            <h6 className="text-uppercase text-muted small mb-2 mt-3">What Travellers Get</h6>
            <Row className="mb-3">
              <Col md={4}>
                <strong>What you&apos;ll do</strong>
                <ul className="small text-muted mb-0 ps-3">
                  {data.what_you_will_do?.length ? data.what_you_will_do.map((i) => <li key={i}>{i}</li>) : <li>—</li>}
                </ul>
              </Col>
              <Col md={4}>
                <strong>Included</strong>
                <ul className="small text-muted mb-0 ps-3">
                  {data.whats_included?.length ? data.whats_included.map((i) => <li key={i}>{i}</li>) : <li>—</li>}
                </ul>
              </Col>
              <Col md={4}>
                <strong>Not included</strong>
                <ul className="small text-muted mb-0 ps-3">
                  {data.whats_not_included?.length ? data.whats_not_included.map((i) => <li key={i}>{i}</li>) : <li>—</li>}
                </ul>
              </Col>
            </Row>
            <p className="mb-3"><strong>Cancellation policy:</strong> {data.cancellation_policy || '—'}</p>

            {data.requirements && (
              <>
                <h6 className="text-uppercase text-muted small mb-2 mt-3">Requirements</h6>
                <p className="mb-3">
                  Fitness: {data.requirements.fitness_level ?? '—'} · Age: {data.requirements.age ?? '—'} · Accessibility: {data.requirements.accessibility ?? '—'}
                </p>
              </>
            )}

            {data.safety_info && (
              <>
                <h6 className="text-uppercase text-muted small mb-2 mt-3">Safety Info</h6>
                <p className="mb-1">
                  Risk: {data.safety_info.riskLevel} · Mobility: {data.safety_info.mobilityAccessibility}
                  {data.safety_info.recommendedTimeOfDay && ` · Recommended time: ${data.safety_info.recommendedTimeOfDay}`}
                </p>
                {data.safety_info.notes?.length > 0 && (
                  <ul className="small text-muted ps-3">
                    {data.safety_info.notes.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                )}
                {data.safety_info.emergencyGuidance && (
                  <p className="small text-muted">{data.safety_info.emergencyGuidance}</p>
                )}
              </>
            )}

            <h6 className="text-uppercase text-muted small mb-2 mt-3">Media &amp; Links</h6>
            <p className="mb-0">
              Cover: {data.cover_image_url ? <a href={data.cover_image_url} target="_blank" rel="noreferrer">link</a> : '—'}
              {' · '}
              Booking: {data.booking_url ? <a href={data.booking_url} target="_blank" rel="noreferrer">link</a> : '—'}
            </p>
          </>
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
      page, limit, status: statusFilter || undefined, search: search || undefined,
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
    onError: () => toast.error('Update failed'),
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
                      {exp.interest_tags && exp.interest_tags.length > 0 && (
                        <div className="small text-muted">{exp.interest_tags.slice(0, 2).join(', ')}</div>
                      )}
                    </td>
                    <td className="text-muted small">{exp.guide?.display_name ?? exp.guide_id}</td>
                    <td>{[exp.city, exp.country].filter(Boolean).join(', ') || '—'}</td>
                    <td>{exp.price_from != null ? `${exp.currency ?? 'USD'} ${exp.price_from}` : '—'}</td>
                    <td><StatusBadge status={exp.status} /></td>
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
