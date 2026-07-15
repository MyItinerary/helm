'use client'

import { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Form,
  Row,
  Col,
  Spinner,
} from 'react-bootstrap'
import { useQuery } from '@tanstack/react-query'
import { temporaryExperiencesService } from '@/services/temporaryExperiences.service'
import { TemporaryExperienceStatus } from '@/types'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'

export default function TemporaryExperiencesPage() {
  const [status, setStatus] = useState<TemporaryExperienceStatus | 'all'>('pending')
  const [socialMedia, setSocialMedia] = useState<string>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['temporary-experiences', { status, socialMedia }],
    queryFn: () => temporaryExperiencesService.list({
      status: status !== 'all' ? status : undefined,
      social_media: socialMedia !== 'all' ? socialMedia : undefined
    }),
  })

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4">Temporary Experiences</h1>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Label>Status</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value as TemporaryExperienceStatus | 'all')}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Social Media</Form.Label>
              <Form.Select value={socialMedia} onChange={(e) => setSocialMedia(e.target.value)}>
                <option value="all">All</option>
                <option value="reddit">Reddit</option>
                <option value="twitter">Twitter</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isLoading ? (
        <div className="text-center py-4"><Spinner animation="border" /></div>
      ) : !data || data.length === 0 ? (
        <Card>
          <Card.Body className="text-center text-muted">
            No temporary experiences found. Run a social media import to generate new suggestions.
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Source</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((ex) => (
                <tr key={ex.id}>
                  <td>{ex.generated_experience_json.title || 'Untitled'}</td>
                  <td>{[ex.generated_experience_json.city, ex.generated_experience_json.country].filter(Boolean).join(', ')}</td>
                  <td>{ex.social_media}</td>
                  <td><StatusBadge status={ex.status} /></td>
                  <td>{new Date(ex.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/admin/temporary-experiences/${ex.id}`} passHref>
                      <Button variant="outline-primary" size="sm" className="me-2">Review</Button>
                    </Link>
                    {ex.social_media_url && (
                      <Button variant="outline-secondary" size="sm" href={ex.social_media_url} target="_blank" rel="noopener noreferrer">Source</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}
