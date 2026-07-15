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

  const handleChange = (path: string, value: any) => {
    setFormData((prev) => {
      const keys = path.split('.')
      const newData = { ...prev }
      let current: any = newData
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        if (!current[key]) {
          current[key] = {}
        }
        current[key] = { ...current[key] }
        current = current[key]
      }
      current[keys[keys.length - 1]] = value
      return newData
    })
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
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control
                  value={formData.city ?? ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Country</Form.Label>
                <Form.Control
                  value={formData.country ?? ''}
                  onChange={(e) => handleChange('country', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Latitude</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.latitude ?? ''}
                  onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Longitude</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.longitude ?? ''}
                  onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Duration (min)</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.duration_minutes ?? ''}
                  onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value, 10))}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Price From</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.price_from ?? ''}
                  onChange={(e) => handleChange('price_from', parseFloat(e.target.value))}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Currency</Form.Label>
                <Form.Control
                  value={formData.currency ?? ''}
                  onChange={(e) => handleChange('currency', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Requirements & Safety</Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Fitness Requirement</Form.Label>
                <Form.Control
                  value={formData.requirements?.fitness ?? ''}
                  onChange={(e) => handleChange('requirements.fitness', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Age Requirement</Form.Label>
                <Form.Control
                  value={formData.requirements?.age ?? ''}
                  onChange={(e) => handleChange('requirements.age', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Accessibility</Form.Label>
                <Form.Control
                  value={formData.requirements?.accessibility ?? ''}
                  onChange={(e) => handleChange('requirements.accessibility', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Risk Level</Form.Label>
                <Form.Control
                  value={formData.safety_info?.riskLevel ?? ''}
                  onChange={(e) => handleChange('safety_info.riskLevel', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Safety Notes (comma separated)</Form.Label>
                <Form.Control
                  value={formData.safety_info?.notes?.join(', ') ?? ''}
                  onChange={(e) => handleChange('safety_info.notes', e.target.value.split(',').map(s => s.trim()))}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Experience Attributes</Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Energy Level</Form.Label>
                <Form.Control
                  value={formData.energy_level ?? ''}
                  onChange={(e) => handleChange('energy_level', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Budget Range</Form.Label>
                <Form.Control
                  value={formData.budget_range ?? ''}
                  onChange={(e) => handleChange('budget_range', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Comfort Level</Form.Label>
                <Form.Control
                  value={formData.comfort_level ?? ''}
                  onChange={(e) => handleChange('comfort_level', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Time of Day</Form.Label>
                <Form.Control
                  value={formData.time_of_day ?? ''}
                  onChange={(e) => handleChange('time_of_day', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Interest Tags (comma separated)</Form.Label>
                <Form.Control
                  value={formData.interest_tags?.join(', ') ?? ''}
                  onChange={(e) => handleChange('interest_tags', e.target.value.split(',').map(s => s.trim()))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Social Style (comma separated)</Form.Label>
                <Form.Control
                  value={formData.social_style?.join(', ') ?? ''}
                  onChange={(e) => handleChange('social_style', e.target.value.split(',').map(s => s.trim()))}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>What You Will Do (comma separated)</Form.Label>
            <Form.Control
              as="textarea"
              value={formData.what_you_will_do?.join('\n') ?? ''}
              onChange={(e) => handleChange('what_you_will_do', e.target.value.split('\n').map(s => s.trim()))}
            />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>What's Included (comma separated)</Form.Label>
                <Form.Control
                  as="textarea"
                  value={formData.whats_included?.join('\n') ?? ''}
                  onChange={(e) => handleChange('whats_included', e.target.value.split('\n').map(s => s.trim()))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>What's Not Included (comma separated)</Form.Label>
                <Form.Control
                  as="textarea"
                  value={formData.whats_not_included?.join('\n') ?? ''}
                  onChange={(e) => handleChange('whats_not_included', e.target.value.split('\n').map(s => s.trim()))}
                />
              </Form.Group>
            </Col>
          </Row>
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
