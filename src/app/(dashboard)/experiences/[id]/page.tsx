'use client'

import {
  Alert, Button, Card, CardBody, Form, Modal, Spinner,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUpRightFromSquare, faCalendarDays, faCheck, faPencil, faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import ExperienceDetails from '@/components/experiences/ExperienceDetails'
import StatusBadge from '@/components/ui/StatusBadge'
import { experienceService } from '@/services/experience.service'
import { publicExperienceUrl } from '@/utils/site'

function TakeDownModal({ show, saving, onClose, onConfirm }: {
  show: boolean
  saving: boolean
  onClose: () => void
  onConfirm: (note: string) => void
}) {
  const [note, setNote] = useState('')
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Take this listing down</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-muted">
          Travellers stop seeing it straight away. The host is emailed this note and can fix the
          listing and publish it again.
        </p>
        <Form.Label htmlFor="review-note">What needs to change</Form.Label>
        <Form.Control
          id="review-note"
          as="textarea"
          rows={4}
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. The cover photo is a stock image. Please use a photo from the experience."
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" disabled={!note.trim() || saving} onClick={() => onConfirm(note.trim())}>
          {saving ? <Spinner size="sm" /> : 'Take down'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default function ExperienceReviewPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [takingDown, setTakingDown] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['experience', id],
    queryFn: () => experienceService.get(id),
  })

  const { mutate: review, isPending } = useMutation({
    mutationFn: ({ decision, note }: { decision: 'approve' | 'reject'; note?: string }) => experienceService.review(id, decision, note),
    onSuccess: (_saved, { decision }) => {
      toast.success(decision === 'approve' ? 'Marked as reviewed' : 'Listing taken down and the host emailed')
      setTakingDown(false)
      queryClient.invalidateQueries({ queryKey: ['experience', id] })
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
    },
    onError: () => toast.error('Review failed'),
  })

  if (isLoading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
  if (!data) return <p className="text-muted">Experience not found.</p>

  const live = data.status === 'ACTIVE'

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <Link href="/experiences" className="small text-muted">← Experiences</Link>
          <h4 className="mb-1">{data.title}</h4>
          <div className="small text-muted">
            <StatusBadge status={data.status} />
            <span className="ms-2">
              {data.guide?.display_name ?? 'Host'}
              {' · '}
              {data.reviewed_at
                ? `Reviewed ${new Date(data.reviewed_at).toLocaleString()}`
                : 'Not reviewed yet'}
            </span>
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {live ? (
            <a
              href={publicExperienceUrl(data.id)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-outline-primary"
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="me-1" />
              Preview as traveller
            </a>
          ) : (
            <Button size="sm" variant="outline-primary" disabled title="Only a live listing has a public page">
              Preview as traveller
            </Button>
          )}
          <Link href={`/experiences/${data.id}/edit`} className="btn btn-sm btn-outline-secondary">
            <FontAwesomeIcon icon={faPencil} className="me-1" />
            Edit
          </Link>
          <Link href={`/experiences/${data.id}/sessions`} className="btn btn-sm btn-outline-secondary">
            <FontAwesomeIcon icon={faCalendarDays} className="me-1" />
            Sessions
          </Link>
        </div>
      </div>

      {data.review_note && !live && (
        <Alert variant="warning">
          <strong>Taken down:</strong> {data.review_note}
        </Alert>
      )}

      {live && (
        <Card className="mb-3 border-info">
          <CardBody className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <span>
              {data.reviewed_at
                ? 'This listing has been reviewed. Take it down if something is wrong.'
                : 'This listing is live. Preview it as a traveller, then mark it reviewed or take it down.'}
            </span>
            <div className="d-flex gap-2">
              {!data.reviewed_at && (
                <Button size="sm" variant="success" disabled={isPending} onClick={() => review({ decision: 'approve' })}>
                  <FontAwesomeIcon icon={faCheck} className="me-1" />
                  Mark reviewed
                </Button>
              )}
              <Button size="sm" variant="outline-danger" disabled={isPending} onClick={() => setTakingDown(true)}>
                <FontAwesomeIcon icon={faXmark} className="me-1" />
                Take down
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <ExperienceDetails data={data} />
        </CardBody>
      </Card>

      <TakeDownModal
        show={takingDown}
        saving={isPending}
        onClose={() => setTakingDown(false)}
        onConfirm={(note) => review({ decision: 'reject', note })}
      />
    </div>
  )
}
