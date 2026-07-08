'use client'

import {
  Badge, Button, Card, CardBody, CardHeader, Col, Form, Modal, Row, Spinner, Tab, Table, Tabs,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { guideService } from '@/services/guide.service'
import StatusBadge from '@/components/ui/StatusBadge'
import type { GuideVerification } from '@/types'

function VerifyModal({
  verification,
  onClose,
}: {
  verification: GuideVerification | null
  onClose: () => void
}) {
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: ({ status, n }: { status: 'approved' | 'rejected'; n: string }) => guideService.verify(verification!.guide_id, { status, notes: n }),
    onSuccess: (_, { status }) => {
      toast.success(`Guide ${status}`)
      queryClient.invalidateQueries({ queryKey: ['guides-unverified'] })
      onClose()
    },
    onError: () => toast.error('Action failed'),
  })

  return (
    <Modal show={!!verification} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Review Verification</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {verification && (
          <>
            <p><strong>Document Type:</strong> {verification.document_type}</p>
            {verification.document_number && (
              <p><strong>Document Number:</strong> {verification.document_number}</p>
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
  const [selectedVerification, setSelectedVerification] = useState<GuideVerification | null>(null)
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
                    </tr>
                  </thead>
                  <tbody>
                    {guides?.items.length === 0 && (
                      <tr><td colSpan={5} className="text-center text-muted py-4">No guides found</td></tr>
                    )}
                    {guides?.items.map((g) => (
                      <tr key={g.id} className="align-middle">
                        <td>
                          <div className="fw-semibold">{g.display_name}</div>
                          {g.headline && <div className="small text-muted">{g.headline}</div>}
                        </td>
                        <td>{[g.city, g.country].filter(Boolean).join(', ') || '—'}</td>
                        <td>{g.rating_avg ? `${g.rating_avg.toFixed(1)} ★ (${g.rating_count})` : '—'}</td>
                        <td><StatusBadge status={g.verification_level} /></td>
                        <td className="text-muted small">{new Date(g.created_at).toLocaleDateString()}</td>
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
                    <th>Guide ID</th>
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
                  {unverified?.map((v) => (
                    <tr key={v.id} className="align-middle">
                      <td className="font-monospace small">{v.guide_id}</td>
                      <td>{v.document_type}</td>
                      <td className="text-muted small">{new Date(v.created_at).toLocaleDateString()}</td>
                      <td><StatusBadge status={v.status} /></td>
                      <td>
                        {v.status === 'pending' && (
                          <Button size="sm" variant="outline-primary" onClick={() => setSelectedVerification(v)}>
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
        verification={selectedVerification}
        onClose={() => setSelectedVerification(null)}
      />
    </div>
  )
}
