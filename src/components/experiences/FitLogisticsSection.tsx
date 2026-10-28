'use client'

import { Col, Form, Row } from 'react-bootstrap'
import type {
  Accessibility, AgePolicy, Experience, FitnessLevel,
} from '@/types'
import TagPillSelect from './TagPillSelect'

const FITNESS_OPTIONS: { id: FitnessLevel, label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'high', label: 'High' },
  { id: 'very_high', label: 'Very high' },
  { id: 'not_applicable', label: 'Not applicable' },
]
const AGE_OPTIONS: { id: AgePolicy, label: string }[] = [
  { id: 'all_ages', label: 'All ages' },
  { id: 'minimum_age', label: 'Minimum age' },
  { id: 'adult_required_under', label: 'Adult required under a set age' },
  { id: 'adults_only', label: 'Adults only' },
]
const ACCESSIBILITY_OPTIONS: { id: Accessibility, label: string }[] = [
  { id: 'wheelchair_accessible', label: 'Wheelchair accessible' },
  { id: 'partly_accessible', label: 'Partly accessible' },
  { id: 'not_suitable', label: 'Not suitable for wheelchairs' },
  { id: 'not_confirmed', label: 'Not confirmed' },
]
// ISO 639 codes, as itin stores them.
const LANGUAGE_OPTIONS = [
  { id: 'en', label: 'English' },
  { id: 'yo', label: 'Yoruba' },
  { id: 'ig', label: 'Igbo' },
  { id: 'ha', label: 'Hausa' },
  { id: 'pcm', label: 'Nigerian Pidgin' },
  { id: 'fr', label: 'French' },
  { id: 'es', label: 'Spanish' },
  { id: 'pt', label: 'Portuguese' },
  { id: 'de', label: 'German' },
  { id: 'ar', label: 'Arabic' },
]
const NOTE_MAX = 100

export const emptyFitLogistics = {
  fitness_level: '',
  fitness_note: '',
  age_policy: '',
  min_age: '',
  age_note: '',
  accessibility: '',
  accessibility_note: '',
  languages: [] as string[],
  weather_dependent: false,
  pickup_available: false,
  pickup_note: '',
}

export type FitLogistics = typeof emptyFitLogistics

export function toFitLogistics(exp?: Partial<Experience>): FitLogistics {
  if (!exp) return emptyFitLogistics
  return {
    fitness_level: exp.fitness_level ?? '',
    fitness_note: exp.fitness_note ?? '',
    age_policy: exp.age_policy ?? '',
    min_age: exp.min_age != null ? String(exp.min_age) : '',
    age_note: exp.age_note ?? '',
    accessibility: exp.accessibility ?? '',
    accessibility_note: exp.accessibility_note ?? '',
    languages: exp.languages ?? [],
    weather_dependent: exp.weather_dependent ?? false,
    pickup_available: exp.pickup_available ?? false,
    pickup_note: exp.pickup_note ?? '',
  }
}

const needsMinAge = (policy: string) => policy === 'minimum_age' || policy === 'adult_required_under'

/** The section's fields as itin expects them; blanks are left undefined. */
export function fitLogisticsPayload(fit: FitLogistics) {
  return {
    fitness_level: fit.fitness_level || undefined,
    fitness_note: fit.fitness_note.trim() || undefined,
    age_policy: fit.age_policy || undefined,
    min_age: needsMinAge(fit.age_policy) && fit.min_age ? Number(fit.min_age) : undefined,
    age_note: fit.age_note.trim() || undefined,
    accessibility: fit.accessibility || undefined,
    accessibility_note: fit.accessibility_note.trim() || undefined,
    languages: fit.languages,
    weather_dependent: fit.weather_dependent,
    pickup_available: fit.pickup_available,
    pickup_note: fit.pickup_available ? (fit.pickup_note.trim() || undefined) : undefined,
  }
}

/** Why the section can't be saved yet, matching itin's rules; null when it can. */
export function fitLogisticsProblem(fit: FitLogistics): string | null {
  if (needsMinAge(fit.age_policy) && !fit.min_age) return 'Add the age for this age policy.'
  if (fit.pickup_available && !fit.pickup_note.trim()) return 'Add a pickup note, or untick pickup.'
  return null
}

interface Props {
  value: FitLogistics
  onChange: (patch: Partial<FitLogistics>) => void
}

function Note({
  value, onChange, label, placeholder = 'Note for guests (optional)',
}: { value: string, onChange: (v: string) => void, label: string, placeholder?: string }) {
  return (
    <>
      <Form.Control
        className="mt-2"
        value={value}
        maxLength={NOTE_MAX}
        placeholder={placeholder}
        aria-label={`${label} note`}
        onChange={(e) => onChange(e.target.value)}
      />
      <Form.Text className="text-muted">{value.length}/{NOTE_MAX}</Form.Text>
    </>
  )
}

/** Fitness, age, accessibility, languages, weather and pickup. */
export default function FitLogisticsSection({ value, onChange }: Props) {
  return (
    <>
      <h6 className="text-uppercase text-muted small mb-3 mt-4">Fit and logistics</h6>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Fitness level *</Form.Label>
            <Form.Select value={value.fitness_level} onChange={(e) => onChange({ fitness_level: e.target.value })}>
              <option value="">Select…</option>
              {FITNESS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </Form.Select>
            <Note label="Fitness" value={value.fitness_note} onChange={(fitness_note) => onChange({ fitness_note })} />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Age *</Form.Label>
            <Form.Select value={value.age_policy} onChange={(e) => onChange({ age_policy: e.target.value })}>
              <option value="">Select…</option>
              {AGE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </Form.Select>
            {needsMinAge(value.age_policy) && (
              <Form.Control
                className="mt-2"
                type="number"
                min={0}
                max={99}
                value={value.min_age}
                placeholder={value.age_policy === 'minimum_age' ? 'Minimum age' : 'Adult required under this age'}
                aria-label="Age"
                onChange={(e) => onChange({ min_age: e.target.value })}
              />
            )}
            <Note label="Age" value={value.age_note} onChange={(age_note) => onChange({ age_note })} />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Accessibility *</Form.Label>
            <Form.Select value={value.accessibility} onChange={(e) => onChange({ accessibility: e.target.value })}>
              <option value="">Select…</option>
              {ACCESSIBILITY_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </Form.Select>
            <Note
              label="Accessibility"
              value={value.accessibility_note}
              onChange={(accessibility_note) => onChange({ accessibility_note })}
            />
            <Form.Text className="text-muted d-block">
              Choose one even if you don&apos;t know: &quot;Not confirmed&quot; tells guests to ask first.
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>
      <Form.Group className="mb-3">
        <Form.Label>Languages</Form.Label>
        <TagPillSelect options={LANGUAGE_OPTIONS} value={value.languages} onChange={(languages) => onChange({ languages })} />
      </Form.Group>
      <Row>
        <Col md={6}>
          <Form.Check
            type="checkbox"
            id="weather-dependent"
            label="Weather dependent"
            checked={value.weather_dependent}
            onChange={(e) => onChange({ weather_dependent: e.target.checked })}
          />
          <Form.Text className="text-muted d-block mb-3">
            The page then says that bad weather means a new date or a full refund. That line is fixed, not written by the host.
          </Form.Text>
        </Col>
        <Col md={6}>
          <Form.Check
            type="checkbox"
            id="pickup-available"
            label="Pickup available"
            checked={value.pickup_available}
            onChange={(e) => onChange({ pickup_available: e.target.checked })}
          />
          {value.pickup_available && (
            <Note
              label="Pickup"
              placeholder="Where you pick guests up (required)"
              value={value.pickup_note}
              onChange={(pickup_note) => onChange({ pickup_note })}
            />
          )}
        </Col>
      </Row>
    </>
  )
}
