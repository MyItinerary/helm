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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useQuery } from '@tanstack/react-query'
import { temporaryExperiencesService } from '@/services/temporaryExperiences.service'
import { TemporaryExperienceStatus } from '@/types'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'

export default function TemporaryExperiencesPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TemporaryExperienceStatus | 'all'>('pending')
  const [socialMedia, setSocialMedia] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['temporary-experiences', page, status, socialMedia, search],
    queryFn: () => temporaryExperiencesService.list({
      page,
      limit,
      status: status !== 'all' ? status : undefined,
      social_media: socialMedia !== 'all' ? socialMedia : undefined,
      search: search || undefined,
    }),
  })

  const commitSearch = () => { setSearch(searchInput); setPage(1) }
  const clearSearch = () => { setSearchInput(''); setSearch(''); setPage(1) }

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4">Temporary Experiences</h1>

      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-end gap-2">
            <Col md={4}>
              <Form.Label>Search</Form.Label>
              <div className="input-group">
                <span className="input-group-text"><FontAwesomeIcon icon={faSearch} /></span>
                <Form.Control
                  placeholder="Title, city, post text, or author... (press Enter)"
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
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={status}
                onChange={(e) => { setStatus(e.target.value as TemporaryExperienceStatus | 'all'); setPage(1) }}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Social Media</Form.Label>
              <Form.Select
                value={socialMedia}
                onChange={(e) => { setSocialMedia(e.target.value); setPage(1) }}
              >
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
      ) : !data || data.items.length === 0 ? (
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
              {data.items.map((ex) => (
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
          {data.total > limit && (
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
      )}
    </div>
  )
}
