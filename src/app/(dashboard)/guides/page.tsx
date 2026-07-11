'use client'

import {
  Badge, Button, Card, CardBody, CardHeader, Col, Form, Modal, Row, Spinner, Tab, Table, Tabs,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch, faCheck, faTimes, faPencil,
} from '@fortawesome/free-solid-svg-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { guideService } from '@/services/guide.service'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Guide } from '@/types'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'yo', label: 'Yoruba' },
  { value: 'ha', label: 'Hausa' },
  { value: 'ig', label: 'Igbo' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'es', label: 'Spanish' },
  { value: 'ar', label: 'Arabic' },
  { value: 'sw', label: 'Swahili' },
  { value: 'de', label: 'German' },
]

const SPECIALITY_OPTIONS = [
  { value: 'hiking', label: 'Hiking' },
  { value: 'city tours', label: 'City Tours' },
  { value: 'food tours', label: 'Food Tours' },
  { value: 'cultural tours', label: 'Cultural Tours' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'photography', label: 'Photography' },
  { value: 'wildlife', label: 'Wildlife & Nature' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'wellness', label: 'Wellness & Spa' },
  { value: 'historical sites', label: 'Historical Sites' },
  { value: 'water sports', label: 'Water Sports' },
]

function EditGuideModal({
  guide,
  onClose,
}: {
  guide: Guide | null
  onClose: () => void
}) {
  const [form, setForm] = useState({
    display_name: '',
    headline: '',
    about: '',
    city: '',
    country: '',
    languages: [] as string[],
    specialities: [] as string[],
    hourly_rate: '',
    currency: '',
  })
  const queryClient = useQueryClient()

  useEffect(() => {
    if (guide) {
      setForm({
        display_name: guide.display_name ?? '',
        headline: guide.headline ?? '',
        about: guide.about ?? '',
        city: guide.city ?? '',
        country: guide.country ?? '',
        languages: guide.languages ?? [],
        specialities: guide.specialities ?? [],
        hourly_rate: guide.hourly_rate != null ? String(guide.hourly_rate) : '',
        currency: guide.currency ?? '',
      })
    }
  }, [guide])

  const { mutate, isPending } = useMutation({
    mutationFn: () => guideService.update(guide!.id, {
      display_name: form.display_name || undefined,
      headline: form.headline || undefined,
      about: form.about || undefined,
      city: form.city || undefined,
      country: form.country || undefined,
      languages: form.languages.length ? form.languages : undefined,
      specialities: form.specialities.length ? form.specialities : undefined,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : undefined,
      currency: form.currency || undefined,
    }),
    onSuccess: () => {
      toast.success('Guide updated')
      queryClient.invalidateQueries({ queryKey: ['guides'] })
      queryClient.invalidateQueries({ queryKey: ['guides-unverified'] })
      onClose()
    },
    onError: () => toast.error('Update failed'),
  })

  const set = (field: 'display_name' | 'headline' | 'about' | 'city' | 'country' | 'hourly_rate' | 'currency') => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const setMulti = (field: 'languages' | 'specialities') => (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [field]: Array.from(e.target.selectedOptions, (o) => o.value) }))

  return (
    <Modal show={!!guide} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Guide Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Display Name</Form.Label>
              <Form.Control value={form.display_name} onChange={set('display_name')} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Headline</Form.Label>
              <Form.Control value={form.headline} onChange={set('headline')} />
            </Form.Group>
          </Col>
        </Row>
        <Form.Group className="mb-3">
          <Form.Label>About</Form.Label>
          <Form.Control as="textarea" rows={3} value={form.about} onChange={set('about')} />
        </Form.Group>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control value={form.city} onChange={set('city')} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Country</Form.Label>
              <Form.Control value={form.country} onChange={set('country')} />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Languages</Form.Label>
              <Form.Select multiple htmlSize={5} value={form.languages} onChange={setMulti('languages')}>
                {LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">Cmd/Ctrl-click to select multiple</Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Specialities</Form.Label>
              <Form.Select multiple htmlSize={5} value={form.specialities} onChange={setMulti('specialities')}>
                {SPECIALITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">Cmd/Ctrl-click to select multiple</Form.Text>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Hourly Rate</Form.Label>
              <Form.Control type="number" value={form.hourly_rate} onChange={set('hourly_rate')} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Currency</Form.Label>
              <Form.Control value={form.currency} onChange={set('currency')} placeholder="USD" />
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={isPending} onClick={() => mutate()}>Save</Button>
      </Modal.Footer>
    </Modal>
  )
}

function VerifyModal({
  guide,
  onClose,
}: {
  guide: Guide | null
  onClose: () => void
}) {
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: ({ status, n }: { status: 'approved' | 'rejected'; n: string }) => guideService.verify(guide!.id, { status, notes: n }),
    onSuccess: (_, { status }) => {
      toast.success(`Guide ${status}`)
      queryClient.invalidateQueries({ queryKey: ['guides-unverified'] })
      onClose()
    },
    onError: () => toast.error('Action failed'),
  })

  return (
    <Modal show={!!guide} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Review Verification</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {guide && (
          <>
            <p><strong>Guide:</strong> {guide.display_name || '(no name on file)'}</p>
            <p><strong>Document Type:</strong> {guide.verification?.id_document_type ?? '—'}</p>
            {guide.verification?.id_document_number && (
              <p><strong>Document Number:</strong> {guide.verification.id_document_number}</p>
            )}
            <Form.Group>
              <Form.Label>Notes (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add rejection reason or approval notes..."
              />
            </Form.Group>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="danger"
          disabled={isPending}
          onClick={() => mutate({ status: 'rejected', n: notes })}
        >
          <FontAwesomeIcon icon={faTimes} className="me-1" />
          Reject
        </Button>
        <Button
          variant="success"
          disabled={isPending}
          onClick={() => mutate({ status: 'approved', n: notes })}
        >
          <FontAwesomeIcon icon={faCheck} className="me-1" />
          Approve
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default function GuidesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null)
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null)
  const limit = 20

  const { data: guides, isLoading } = useQuery({
    queryKey: ['guides', page, search],
    queryFn: () => guideService.list({ page, limit, search: search || undefined }),
  })

  const { data: unverified } = useQuery({
    queryKey: ['guides-unverified'],
    queryFn: guideService.listUnverified,
  })

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Hosts / Curators</h4>
        <small className="text-muted">{guides?.total ?? 0} total</small>
      </div>

      <Tabs defaultActiveKey="all" className="mb-3">
        <Tab
          eventKey="all"
          title="All Guides"
        >
          <Card>
            <CardHeader>
              <Row>
                <Col md={4}>
                  <div className="input-group">
                    <span className="input-group-text"><FontAwesomeIcon icon={faSearch} /></span>
                    <Form.Control
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    />
                  </div>
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
                      <th>Name</th>
                      <th>Location</th>
                      <th>Rating</th>
                      <th>Verification</th>
                      <th>Joined</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {guides?.items.length === 0 && (
                      <tr><td colSpan={6} className="text-center text-muted py-4">No guides found</td></tr>
                    )}
                    {guides?.items.map((g) => (
                      <tr key={g.id} className="align-middle">
                        <td>
                          <div className="fw-semibold">{g.display_name || '(no name on file)'}</div>
                          {g.headline && <div className="small text-muted">{g.headline}</div>}
                        </td>
                        <td>{[g.city, g.country].filter(Boolean).join(', ') || '—'}</td>
                        <td>{g.rating_avg ? `${g.rating_avg.toFixed(1)} ★ (${g.rating_count})` : '—'}</td>
                        <td><StatusBadge status={g.verification_level} /></td>
                        <td className="text-muted small">{new Date(g.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            title="Edit"
                            onClick={() => setEditingGuide(g)}
                          >
                            <FontAwesomeIcon icon={faPencil} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
            {guides && guides.total > limit && (
              <div className="card-footer d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, guides.total)} of {guides.total}
                </small>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page * limit >= guides.total} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
              </div>
            )}
          </Card>
        </Tab>

        <Tab
          eventKey="unverified"
          title={(
            <span>
              Pending Verification
              {unverified && unverified.length > 0 && (
                <Badge bg="warning" className="ms-2">{unverified.length}</Badge>
              )}
            </span>
          )}
        >
          <Card>
            <CardBody className="p-0">
              <Table hover responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Guide</th>
                    <th>Document Type</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(!unverified || unverified.length === 0) && (
                    <tr><td colSpan={5} className="text-center text-muted py-4">No pending verifications</td></tr>
                  )}
                  {unverified?.map((g) => (
                    <tr key={g.id} className="align-middle">
                      <td>
                        <div className="fw-semibold">{g.display_name || '(no name on file)'}</div>
                        <div className="font-monospace small text-muted">{g.id}</div>
                      </td>
                      <td>{g.verification?.id_document_type ?? '—'}</td>
                      <td className="text-muted small">
                        {g.verification ? new Date(g.verification.submitted_at).toLocaleDateString() : '—'}
                      </td>
                      <td><StatusBadge status={g.verification?.status ?? 'not_submitted'} /></td>
                      <td>
                        {(!g.verification || g.verification.status === 'pending') && (
                          <Button size="sm" variant="outline-primary" onClick={() => setSelectedGuide(g)}>
                            Review
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      <VerifyModal
        guide={selectedGuide}
        onClose={() => setSelectedGuide(null)}
      />

      <EditGuideModal
        guide={editingGuide}
        onClose={() => setEditingGuide(null)}
      />
    </div>
  )
}
