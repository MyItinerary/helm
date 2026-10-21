'use client'

import {
  Badge, Button, Card, CardBody, CardHeader, Nav, Spinner, Table,
} from 'react-bootstrap'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import HideReviewModal from '@/components/reviews/HideReviewModal'
import { apiErrorDetail } from '@/services/refund.service'
import {
  reviewService, stars, type AdminReview, type ReviewTab,
} from '@/services/review.service'

// Traveller reviews go live straight away. Admins hide the ones that break
// the rules (personal details, abuse, off-topic) and can show them again.
export default function ReviewsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<ReviewTab>('visible')
  const [hiding, setHiding] = useState<AdminReview | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', tab],
    queryFn: () => reviewService.list({ status: tab }),
  })

  const unhide = useMutation({
    mutationFn: (id: string) => reviewService.unhide(id),
    onSuccess: () => {
      toast.success('Review shown again')
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
    },
    onError: (error) => toast.error(apiErrorDetail(error, 'Could not show the review')),
  })

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Reviews</h4>
        {data && <Badge bg="secondary">{data.length} {tab}</Badge>}
      </div>

      <Card>
        <CardHeader>
          <Nav variant="tabs" activeKey={tab} onSelect={(k) => setTab((k as ReviewTab) ?? 'visible')} className="border-0">
            <Nav.Item><Nav.Link eventKey="visible">Live</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="hidden">Hidden</Nav.Link></Nav.Item>
          </Nav>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Experience</th>
                  <th>Traveller</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>{tab === 'visible' ? 'Posted' : 'Hidden'}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      {tab === 'visible' ? 'No reviews yet.' : 'No hidden reviews.'}
                    </td>
                  </tr>
                )}
                {data?.map((r) => (
                  <tr key={r.id}>
                    <td className="small">{r.experience_title ?? '—'}</td>
                    <td className="small">
                      <div>{r.author_name}</div>
                      <div className="text-muted">{r.author_email ?? ''}</div>
                    </td>
                    <td className="text-warning text-nowrap">{stars(r.rating)}</td>
                    <td className="small" style={{ maxWidth: 360 }}>
                      <div className="text-truncate" title={r.comment ?? ''}>{r.comment ?? <span className="text-muted">No comment</span>}</div>
                      {tab === 'hidden' && r.hidden_reason && (
                        <div className="text-danger text-truncate" title={r.hidden_reason}>Hidden: {r.hidden_reason}</div>
                      )}
                    </td>
                    <td className="small text-muted">
                      {new Date((tab === 'visible' ? r.created_at : r.hidden_at) ?? r.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      {tab === 'visible' ? (
                        <Button size="sm" variant="outline-danger" onClick={() => setHiding(r)}>Hide</Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline-primary"
                          disabled={unhide.isPending}
                          onClick={() => unhide.mutate(r.id)}
                        >
                          Show again
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <HideReviewModal review={hiding} onHide={() => setHiding(null)} />
    </div>
  )
}
