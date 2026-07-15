'use client'

import { useState } from 'react'
import {
  Button, Card, Col, Form, Row, Spinner,
} from 'react-bootstrap'
import { TemporaryExperience, GeneratedExperienceJson } from '@/types'

interface Props {
  experience: TemporaryExperience
  onSave: (data: { generated_experience_json: GeneratedExperienceJson }) => void
  onApprove: () => void
  onReject: () => void
  isSaving: boolean
  isApproving: boolean
  isRejecting: boolean
}

export default function TemporaryExperienceForm({
  experience, onSave, onApprove, onReject, isSaving, isApproving, isRejecting,
}: Props) {
  const [formData, setFormData] = useState<GeneratedExperienceJson>(experience.generated_experience_json)

  const handleChange = (field: keyof GeneratedExperienceJson, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ generated_experience_json: formData })
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Card className="mb-4">
        <Card.Header>Experience Details</Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  value={formData.title ?? ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Headline</Form.Label>
                <Form.Control
                  value={formData.headline ?? ''}
                  onChange={(e) => handleChange('headline', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={formData.description ?? ''}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </Form.Group>
          {/* Add more fields as needed for the full experience structure */}
        </Card.Body>
      </Card>

      <div className="d-flex gap-2">
        <Button type="submit" disabled={isSaving || isApproving || isRejecting}>
          {isSaving ? <Spinner size="sm" /> : 'Save Changes'}
        </Button>
        <Button variant="success" onClick={onApprove} disabled={isSaving || isApproving || isRejecting}>
          {isApproving ? <Spinner size="sm" /> : 'Approve Experience'}
        </Button>
        <Button variant="danger" onClick={onReject} disabled={isSaving || isApproving || isRejecting}>
          {isRejecting ? <Spinner size="sm" /> : 'Reject'}
        </Button>
      </div>
    </Form>
  )
}
