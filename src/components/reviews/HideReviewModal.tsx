'use client'

import { Button, Form, Modal, Spinner } from 'react-bootstrap'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { apiErrorDetail } from '@/services/refund.service'
import { reviewService, stars, type AdminReview } from '@/services/review.service'

interface Props {
  review: AdminReview | null
  onHide: () => void
}

// Hiding takes the review off the experience page and out of the rating.
// The reason is kept so another admin can see why.
export default function HideReviewModal({ review, onHide }: Props) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')

  const hide = useMutation({
    mutationFn: () => reviewService.hide(review!.id, reason.trim()),
    onSuccess: () => {
      toast.success('Review hidden')
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      setReason('')
      onHide()
    },
    onError: (error) => toast.error(apiErrorDetail(error, 'Could not hide the review')),
  })

  return (
    <Modal show={!!review} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Hide review</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {review && (
          <>
            <p className="mb-1">
              <span className="text-warning">{stars(review.rating)}</span>{' '}
              <span className="text-muted small">by {review.author_name} on {review.experience_title ?? 'a removed experience'}</span>
            </p>
            {review.comment && <blockquote className="border-start ps-3 text-muted small">{review.comment}</blockquote>}
          </>
        )}
        <Form.Group className="mt-3">
          <Form.Label>Why are you hiding it?</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Contains the host's phone number"
          />
          <Form.Text>The traveller still sees their own review. It stops counting towards the rating.</Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
        <Button variant="danger" disabled={reason.trim().length < 3 || hide.isPending} onClick={() => hide.mutate()}>
          {hide.isPending ? <Spinner size="sm" animation="border" /> : 'Hide review'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
