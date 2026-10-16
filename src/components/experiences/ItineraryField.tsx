'use client'

import { Button, Form } from 'react-bootstrap'
import type { ItineraryStep } from '@/types'

// Matches itin's ItineraryStep limits.
export const MAX_ITINERARY_STEPS = 12
const MAX_TITLE = 80
const MAX_DESCRIPTION = 300

interface Props {
  steps: ItineraryStep[]
  onChange: (steps: ItineraryStep[]) => void
}

/** Ordered itinerary steps: a short title and an optional one-line detail. */
export default function ItineraryField({ steps, onChange }: Props) {
  const update = (index: number, patch: Partial<ItineraryStep>) =>
    onChange(steps.map((step, i) => (i === index ? { ...step, ...patch } : step)))
  const remove = (index: number) => onChange(steps.filter((_, i) => i !== index))
  const move = (index: number, by: -1 | 1) => {
    const next = [...steps]
    ;[next[index], next[index + by]] = [next[index + by], next[index]]
    onChange(next)
  }

  return (
    <Form.Group className="mb-3">
      <Form.Label>Itinerary (optional)</Form.Label>
      {steps.map((step, index) => (
        // Index keys: steps have no identity beyond their position.
        // eslint-disable-next-line react/no-array-index-key
        <div key={index} className="d-flex align-items-start gap-2 mb-2">
          <span className="text-muted pt-2" style={{ minWidth: 20 }}>{index + 1}.</span>
          <div className="flex-grow-1 d-flex flex-column gap-1">
            <Form.Control
              value={step.title}
              maxLength={MAX_TITLE}
              placeholder="Step title, e.g. Meet at the jetty"
              aria-label={`Step ${index + 1} title`}
              onChange={(e) => update(index, { title: e.target.value })}
            />
            <Form.Control
              value={step.description ?? ''}
              maxLength={MAX_DESCRIPTION}
              placeholder="Detail (optional)"
              aria-label={`Step ${index + 1} detail`}
              onChange={(e) => update(index, { description: e.target.value })}
            />
          </div>
          <div className="d-flex gap-1">
            <Button type="button" variant="outline-secondary" size="sm" aria-label="Move up"
              disabled={index === 0} onClick={() => move(index, -1)}>↑</Button>
            <Button type="button" variant="outline-secondary" size="sm" aria-label="Move down"
              disabled={index === steps.length - 1} onClick={() => move(index, 1)}>↓</Button>
            <Button type="button" variant="outline-danger" size="sm" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        </div>
      ))}
      {steps.length < MAX_ITINERARY_STEPS && (
        <Button type="button" variant="outline-secondary" size="sm"
          onClick={() => onChange([...steps, { title: '', description: '' }])}>
          Add step
        </Button>
      )}
      <Form.Text className="text-muted d-block">
        Shown in order on the experience page. Steps without a title aren&apos;t saved.
      </Form.Text>
    </Form.Group>
  )
}
