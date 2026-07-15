'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Alert,
} from 'react-bootstrap'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { temporaryExperiencesService } from '@/services/temporaryExperiences.service'
import { SocialMediaPlatform, SocialMediaImportResponse } from '@/types'
import Link from 'next/link'

export default function SocialMediaImportPage() {
  const [platforms, setPlatforms] = useState<SocialMediaPlatform[]>(['reddit'])
  const [keywords, setKeywords] = useState<string>('tourist spots, hidden gems')
  const [days, setDays] = useState<number>(7)
  const [result, setResult] = useState<SocialMediaImportResponse | null>(null)

  const { mutate: runImport, isPending } = useMutation({
    mutationFn: temporaryExperiencesService.import,
    onSuccess: (data) => {
      setResult(data)
      toast.success('Import completed successfully.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to run import.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runImport({
      platforms,
      keywords: keywords.split(',').map((k) => k.trim()),
      days,
    })
  }

  const togglePlatform = (platform: SocialMediaPlatform) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-4">Social Media Import</h1>

      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Platforms</Form.Label>
              <div className="d-flex gap-3">
                {(['reddit', 'twitter', 'instagram', 'facebook'] as SocialMediaPlatform[]).map(
                  (platform) => (
                    <Form.Check
                      key={platform}
                      type="checkbox"
                      label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                      checked={platforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                      disabled={isPending}
                    />
                  )
                )}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Keywords (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                disabled={isPending}
                placeholder="e.g. tourist spots, hidden gems"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Days back</Form.Label>
              <Form.Control
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                disabled={isPending}
              />
            </Form.Group>

            <Button type="submit" disabled={isPending || platforms.length === 0}>
              {isPending ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Importing...
                </>
              ) : (
                'Run Import'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {result && (
        <Card className="mb-4">
          <Card.Header>Import Results</Card.Header>
          <Card.Body>
            <Row>
              <Col md={4} className="mb-2">Total found: <strong>{result.total_found}</strong></Col>
              <Col md={4} className="mb-2">Total analyzed: <strong>{result.total_analyzed}</strong></Col>
              <Col md={4} className="mb-2">Created: <strong>{result.temporary_experiences_created}</strong></Col>
              <Col md={4} className="mb-2">Duplicates: <strong>{result.duplicates_skipped}</strong></Col>
              <Col md={4} className="mb-2">Skipped: <strong>{result.skipped}</strong></Col>
            </Row>
            {result.errors.length > 0 && (
              <Alert variant="warning" className="mt-3">
                <Alert.Heading>Errors</Alert.Heading>
                <ul>
                  {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </Alert>
            )}
            <div className="mt-3">
              <Link href="/admin/temporary-experiences" passHref>
                <Button variant="primary">Review Pending Experiences</Button>
              </Link>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
