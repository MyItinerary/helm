'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Alert,
  ProgressBar,
} from 'react-bootstrap'
import { toast } from 'sonner'
import { temporaryExperiencesService } from '@/services/temporaryExperiences.service'
import { SocialMediaPlatform, SocialMediaImportResponse, ImportProgressEvent } from '@/types'
import Link from 'next/link'

function formatEvent(event: ImportProgressEvent): string {
  switch (event.type) {
    case 'start':
      return `Starting import: ${event.platforms.join(', ')} (last ${event.days}d, provider=${event.provider})`
    case 'phase':
      if (event.phase === 'searching') return `Searching ${event.platform}...`
      if (event.phase === 'searched') return `Found ${event.found} post(s) on ${event.platform}`
      return `Analyzing ${event.total} post(s)...`
    case 'platform_error':
      return `⚠ ${event.platform} search failed: ${event.message}`
    case 'item':
      return `[${event.current}/${event.total}] ${event.platform} ${event.post_id} — ${event.outcome}`
    case 'fatal':
      return `✖ Fatal: ${event.message}`
    case 'done':
      return 'Import complete.'
    default:
      return ''
  }
}

export default function SocialMediaImportPage() {
  const [platforms, setPlatforms] = useState<SocialMediaPlatform[]>(['reddit'])
  const [keywords, setKeywords] = useState<string>('tourist spots, hidden gems')
  const [days, setDays] = useState<number>(7)
  const [events, setEvents] = useState<ImportProgressEvent[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<SocialMediaImportResponse | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [events.length])

  const lastItemEvent = [...events].reverse().find((e) => e.type === 'item') as
    | Extract<ImportProgressEvent, { type: 'item' }>
    | undefined
  const analyzingPhase = events.find((e) => e.type === 'phase' && e.phase === 'analyzing') as
    | Extract<ImportProgressEvent, { type: 'phase'; phase: 'analyzing' }>
    | undefined
  const progressTotal = lastItemEvent?.total ?? analyzingPhase?.total ?? 0
  const progressCurrent = lastItemEvent?.current ?? 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEvents([])
    setResult(null)
    setIsRunning(true)
    const controller = new AbortController()
    abortControllerRef.current = controller
    try {
      await temporaryExperiencesService.importStream(
        { platforms, keywords: keywords.split(',').map((k) => k.trim()), days },
        (event) => {
          setEvents((prev) => [...prev, event])
          if (event.type === 'done') setResult(event.summary)
        },
        controller.signal,
      )
      toast.success('Import completed successfully.')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error((err as Error).message || 'Failed to run import.')
      }
    } finally {
      setIsRunning(false)
      abortControllerRef.current = null
    }
  }

  const handleCancel = () => abortControllerRef.current?.abort()

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
                      disabled={isRunning}
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
                disabled={isRunning}
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
                disabled={isRunning}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" disabled={isRunning || platforms.length === 0}>
                {isRunning ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Importing...
                  </>
                ) : (
                  'Run Import'
                )}
              </Button>
              {isRunning && (
                <Button type="button" variant="outline-danger" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

      {events.length > 0 && (
        <Card className="mb-4">
          <Card.Header>Progress</Card.Header>
          <Card.Body>
            {progressTotal > 0 && (
              <ProgressBar
                className="mb-3"
                now={progressCurrent}
                max={progressTotal}
                label={`${progressCurrent} / ${progressTotal}`}
                animated={isRunning}
              />
            )}
            <div
              ref={logRef}
              className="font-monospace small border rounded p-2 bg-body-tertiary text-body-secondary"
              style={{ maxHeight: 300, overflowY: 'auto' }}
            >
              {events.map((event, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i}>{formatEvent(event)}</div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

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
