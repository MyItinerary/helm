'use client'

import {
  Button, Card, CardBody, Col, Form, ListGroup, Row, Spinner,
} from 'react-bootstrap'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { experienceService } from '@/services/experience.service'
import { uploadService } from '@/services/upload.service'
import { searchLocation, type GeocodeResult } from '@/lib/geocoding'
import { useCategoryOptions } from '@/hooks/use-category-options'
import type { Experience } from '@/types'
import { formatRecurrenceSummary, type RecurrenceSummaryInput } from '@/utils/recurrence'
import TagPillSelect from './TagPillSelect'
import CustomRecurrenceModal, { type RecurrenceFields } from './CustomRecurrenceModal'
import TimeInput from './TimeInput'

// interest_tags is a free-form Postgres array server-side, so any ids here are safe to add.
const INTEREST_OPTIONS = [
  { id: 'food', label: 'Local food & drinks' },
  { id: 'culture', label: 'Culture & history' },
  { id: 'nature', label: 'Nature & outdoors' },
  { id: 'nightlife', label: 'Nightlife & music' },
  { id: 'art', label: 'Art & creativity' },
  { id: 'wellness', label: 'Wellness & calm' },
  { id: 'street_life', label: 'Street life' },
  { id: 'events', label: 'Events & live shows' },
]
// energy_level, budget_range, comfort_level, and social_style are admin-editable
// categories (see the Categories admin page) — their option lists are fetched
// live via useCategoryOptions() below rather than hardcoded here.
const TIME_OF_DAY_OPTIONS = ['day', 'night']
const RISK_LEVEL_OPTIONS = ['LOW', 'MEDIUM', 'HIGH']
const MOBILITY_OPTIONS = ['FULL', 'LIMITED', 'UNKNOWN']
const CURRENCY_OPTIONS = ['NGN', 'USD', 'GBP']
const DURATION_HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => String(i))
const DURATION_MIN_OPTIONS = ['0', '15', '30', '45']
const MAX_DESCRIPTION_WORDS = 100
const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)

const emptyForm = {
  title: '',
  headline: '',
  description: '',
  city: '',
  country: '',
  latitude: '',
  longitude: '',
  price_from: '',
  currency: 'NGN',
  duration_hours: '',
  duration_mins: '',
  group_size_max: '',
  interest_tags: [] as string[],
  energy_level: '',
  budget_range: '',
  social_style: [] as string[],
  comfort_level: '',
  time_of_day: '',
  schedule_type: '',
  event_start_date: '',
  event_end_date: '',
  start_time: '',
  recurrence_type: '',
  recurrence_interval: '1',
  recurrence_days: [] as string[],
  recurrence_month_mode: '',
  recurrence_month_days: [] as string[],
  recurrence_week_of_month: '',
  recurrence_weekday: '',
  recurrence_start_date: '',
  recurrence_end_type: 'never',
  recurrence_end_date: '',
  recurrence_count: '',
  is_featured: false,
  what_you_will_do: '',
  whats_included: '',
  whats_not_included: '',
  cancellation_policy: '',
  fitness_level: '',
  age: '',
  accessibility: '',
  risk_level: '',
  safety_notes: '',
  mobility_accessibility: '',
  emergency_guidance: '',
  cover_image_url: '',
  booking_url: '',
}

type FormState = typeof emptyForm

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)
const joinLines = (arr?: string[]) => (arr ?? []).join('\n')

function toFormState(exp?: Partial<Experience>): FormState {
  if (!exp) return emptyForm
  return {
    title: exp.title ?? '',
    headline: exp.headline ?? '',
    description: exp.description ?? '',
    city: exp.city ?? '',
    country: exp.country ?? '',
    latitude: exp.latitude != null ? String(exp.latitude) : '',
    longitude: exp.longitude != null ? String(exp.longitude) : '',
    price_from: exp.price_from != null ? String(exp.price_from) : '',
    currency: exp.currency ?? 'NGN',
    duration_hours: exp.duration_minutes != null ? String(Math.floor(exp.duration_minutes / 60)) : '',
    duration_mins: exp.duration_minutes != null ? String(exp.duration_minutes % 60) : '',
    group_size_max: exp.group_size_max != null ? String(exp.group_size_max) : '',
    interest_tags: exp.interest_tags ?? [],
    energy_level: exp.energy_level ?? '',
    budget_range: exp.budget_range ?? '',
    social_style: exp.social_style ?? [],
    comfort_level: exp.comfort_level ?? '',
    time_of_day: exp.time_of_day ?? '',
    schedule_type: exp.schedule_type ?? '',
    event_start_date: exp.event_start_date ?? '',
    event_end_date: exp.event_end_date ?? '',
    start_time: exp.start_time ?? '',
    recurrence_type: exp.recurrence_type ?? '',
    // Legacy rows predate recurrence_interval — a bare weekly/monthly row always meant
    // "every 1"; and predate recurrence_month_mode — the only mode that existed before
    // was day-of-month, so infer it (not '') or editing an old monthly experience would
    // silently drop its recurrence_month_days in the new UI.
    recurrence_interval: exp.recurrence_interval != null ? String(exp.recurrence_interval) : '1',
    recurrence_days: exp.recurrence_days ?? [],
    recurrence_month_mode: exp.recurrence_month_mode
      ?? (exp.recurrence_month_days?.length ? 'day_of_month' : ''),
    recurrence_month_days: exp.recurrence_month_days?.map(String) ?? [],
    recurrence_week_of_month: exp.recurrence_week_of_month != null ? String(exp.recurrence_week_of_month) : '',
    recurrence_weekday: exp.recurrence_weekday ?? '',
    recurrence_start_date: exp.recurrence_start_date ?? '',
    recurrence_end_type: exp.recurrence_end_type
      ?? (exp.recurrence_end_date ? 'on_date' : (exp.recurrence_count ? 'after_occurrences' : 'never')),
    recurrence_end_date: exp.recurrence_end_date ?? '',
    recurrence_count: exp.recurrence_count != null ? String(exp.recurrence_count) : '',
    is_featured: exp.is_featured ?? false,
    what_you_will_do: joinLines(exp.what_you_will_do),
    whats_included: joinLines(exp.whats_included),
    whats_not_included: joinLines(exp.whats_not_included),
    cancellation_policy: exp.cancellation_policy ?? '',
    fitness_level: exp.requirements?.fitness_level ?? '',
    age: exp.requirements?.age ?? '',
    accessibility: exp.requirements?.accessibility ?? '',
    risk_level: exp.safety_info?.riskLevel ?? '',
    safety_notes: joinLines(exp.safety_info?.notes),
    mobility_accessibility: exp.safety_info?.mobilityAccessibility ?? '',
    emergency_guidance: exp.safety_info?.emergencyGuidance ?? '',
    cover_image_url: exp.cover_image_url ?? '',
    booking_url: exp.booking_url ?? '',
  }
}

// FormState keeps every field as a string/string[] (matching the plain HTML inputs); this
// adapts the recurrence slice into the numeric shape formatRecurrenceSummary expects.
function recurrenceFieldsForSummary(form: FormState): RecurrenceSummaryInput {
  return {
    recurrence_type: (form.recurrence_type || undefined) as RecurrenceSummaryInput['recurrence_type'],
    recurrence_interval: form.recurrence_interval ? Number(form.recurrence_interval) : undefined,
    recurrence_days: form.recurrence_days,
    recurrence_month_mode: (form.recurrence_month_mode || undefined) as RecurrenceSummaryInput['recurrence_month_mode'],
    recurrence_month_days: form.recurrence_month_days.map(Number),
    recurrence_week_of_month: form.recurrence_week_of_month ? Number(form.recurrence_week_of_month) : undefined,
    recurrence_weekday: form.recurrence_weekday || undefined,
    recurrence_start_date: form.recurrence_start_date || undefined,
    recurrence_end_type: (form.recurrence_end_type || undefined) as RecurrenceSummaryInput['recurrence_end_type'],
    recurrence_end_date: form.recurrence_end_date || undefined,
    recurrence_count: form.recurrence_count ? Number(form.recurrence_count) : undefined,
  }
}

interface ExperienceFormProps {
  mode: 'create' | 'edit'
  experienceId?: string
  initialValues?: Partial<Experience>
}

export default function ExperienceForm({ mode, experienceId, initialValues }: ExperienceFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => toFormState(initialValues))
  const queryClient = useQueryClient()
  const { byType: categoriesByType, isLoading: categoriesLoading } = useCategoryOptions()
  const socialStyleOptions = (categoriesByType.social_style ?? []).map((c) => ({ id: c.slug, label: c.text }))
  const energyOptions = categoriesByType.energy_level ?? []
  const budgetOptions = categoriesByType.budget_level ?? []
  const comfortOptions = categoriesByType.comfort_level ?? []

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        headline: form.headline || undefined,
        description: form.description || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        price_from: form.price_from ? Number(form.price_from) : undefined,
        currency: form.currency || undefined,
        duration_minutes: (form.duration_hours || form.duration_mins)
          ? Number(form.duration_hours || 0) * 60 + Number(form.duration_mins || 0)
          : undefined,
        group_size_max: form.group_size_max ? Number(form.group_size_max) : undefined,
        interest_tags: form.interest_tags.length ? form.interest_tags : undefined,
        energy_level: form.energy_level || undefined,
        budget_range: form.budget_range || undefined,
        social_style: form.social_style.length ? form.social_style : undefined,
        comfort_level: form.comfort_level || undefined,
        time_of_day: form.time_of_day || undefined,
        schedule_type: form.schedule_type || undefined,
        event_start_date: form.schedule_type === 'one_off' ? (form.event_start_date || undefined) : undefined,
        event_end_date: form.schedule_type === 'one_off' ? (form.event_end_date || undefined) : undefined,
        start_time: form.schedule_type ? (form.start_time || undefined) : undefined,
        recurrence_type: form.schedule_type === 'recurring' ? (form.recurrence_type || undefined) : undefined,
        recurrence_interval: form.schedule_type === 'recurring' && form.recurrence_interval
          ? Number(form.recurrence_interval) : undefined,
        recurrence_days: form.schedule_type === 'recurring' && form.recurrence_type === 'weekly' && form.recurrence_days.length
          ? form.recurrence_days : undefined,
        recurrence_month_mode: form.schedule_type === 'recurring' && form.recurrence_type === 'monthly'
          ? (form.recurrence_month_mode || undefined) : undefined,
        recurrence_month_days: form.schedule_type === 'recurring' && form.recurrence_type === 'monthly'
          && form.recurrence_month_mode === 'day_of_month' && form.recurrence_month_days.length
          ? form.recurrence_month_days.map(Number) : undefined,
        recurrence_week_of_month: form.schedule_type === 'recurring' && form.recurrence_type === 'monthly'
          && form.recurrence_month_mode === 'day_of_week' && form.recurrence_week_of_month
          ? Number(form.recurrence_week_of_month) : undefined,
        recurrence_weekday: form.schedule_type === 'recurring' && form.recurrence_type === 'monthly'
          && form.recurrence_month_mode === 'day_of_week'
          ? (form.recurrence_weekday || undefined) : undefined,
        recurrence_start_date: form.schedule_type === 'recurring' ? (form.recurrence_start_date || undefined) : undefined,
        recurrence_end_type: form.schedule_type === 'recurring' ? (form.recurrence_end_type || undefined) : undefined,
        recurrence_end_date: form.schedule_type === 'recurring' && form.recurrence_end_type === 'on_date'
          ? (form.recurrence_end_date || undefined) : undefined,
        recurrence_count: form.schedule_type === 'recurring' && form.recurrence_end_type === 'after_occurrences' && form.recurrence_count
          ? Number(form.recurrence_count) : undefined,
        is_featured: form.is_featured,
        cover_image_url: form.cover_image_url || undefined,
        booking_url: form.booking_url || undefined,
        what_you_will_do: lines(form.what_you_will_do).length ? lines(form.what_you_will_do) : undefined,
        whats_included: lines(form.whats_included).length ? lines(form.whats_included) : undefined,
        whats_not_included: lines(form.whats_not_included).length ? lines(form.whats_not_included) : undefined,
        cancellation_policy: form.cancellation_policy || undefined,
        requirements: (form.fitness_level || form.age || form.accessibility) ? {
          fitness_level: form.fitness_level || undefined,
          age: form.age || undefined,
          accessibility: form.accessibility || undefined,
        } : undefined,
        safety_info: form.risk_level ? {
          riskLevel: form.risk_level,
          notes: lines(form.safety_notes),
          mobilityAccessibility: form.mobility_accessibility || 'UNKNOWN',
          emergencyGuidance: form.emergency_guidance || undefined,
        } : undefined,
      }
      return mode === 'edit' && experienceId
        ? experienceService.update(experienceId, payload)
        : experienceService.create(payload)
    },
    onSuccess: () => {
      toast.success(mode === 'edit' ? 'Experience updated' : 'Experience created')
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
      if (mode === 'edit' && experienceId) {
        queryClient.invalidateQueries({ queryKey: ['experience', experienceId] })
      }
      router.push('/experiences')
    },
    onError: () => toast.error(mode === 'edit' ? 'Failed to update experience' : 'Failed to create experience'),
  })

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const setDescription = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target
    if (countWords(value) > MAX_DESCRIPTION_WORDS) return
    setForm((f) => ({ ...f, description: value }))
  }

  const setSelect = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const setMulti = (field: 'interest_tags' | 'social_style') => (next: string[]) => setForm((f) => ({ ...f, [field]: next }))

  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false)
  const recurrenceFields: RecurrenceFields = {
    recurrence_type: form.recurrence_type,
    recurrence_interval: form.recurrence_interval,
    recurrence_days: form.recurrence_days,
    recurrence_month_mode: form.recurrence_month_mode,
    recurrence_month_days: form.recurrence_month_days,
    recurrence_week_of_month: form.recurrence_week_of_month,
    recurrence_weekday: form.recurrence_weekday,
    recurrence_end_type: form.recurrence_end_type,
    recurrence_end_date: form.recurrence_end_date,
    recurrence_count: form.recurrence_count,
  }
  const saveRecurrence = (next: RecurrenceFields) => setForm((f) => ({ ...f, ...next }))

  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<GeocodeResult[]>([])
  const [showLocationResults, setShowLocationResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!locationQuery.trim()) {
      setLocationResults([])
      return undefined
    }
    debounceRef.current = setTimeout(() => {
      searchLocation(locationQuery)
        .then((results) => {
          setLocationResults(results)
          setShowLocationResults(true)
        })
        .catch(() => setLocationResults([]))
    }, 450)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [locationQuery])

  const selectLocation = (result: GeocodeResult) => {
    setForm((f) => ({
      ...f,
      city: result.city ?? f.city,
      country: result.country ?? f.country,
      latitude: String(result.lat),
      longitude: String(result.lon),
    }))
    setLocationQuery(result.label)
    setShowLocationResults(false)
  }

  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingImage(true)
    try {
      const url = await uploadService.uploadToCloudinary(file)
      setForm((f) => ({ ...f, cover_image_url: url }))
      toast.success('Image uploaded')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setIsUploadingImage(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">{mode === 'edit' ? 'Edit Experience' : 'Create Experience'}</h4>
      </div>

      <Card>
        <CardBody>
          <h6 className="text-uppercase text-muted small mb-3">Basic Info</h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Title *</Form.Label>
                <Form.Control value={form.title} onChange={set('title')} placeholder="Street food tour of Lagos" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select value={form.headline} onChange={setSelect('headline')}>
                  <option value="">Select…</option>
                  {INTEREST_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} value={form.description} onChange={setDescription} />
            <Form.Text className="text-muted">{countWords(form.description)}/{MAX_DESCRIPTION_WORDS} words</Form.Text>
          </Form.Group>

          <h6 className="text-uppercase text-muted small mb-3 mt-4">Location</h6>
          <Form.Group className="mb-3 position-relative">
            <Form.Label>Search location</Form.Label>
            <Form.Control
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onFocus={() => setShowLocationResults(locationResults.length > 0)}
              onBlur={() => setTimeout(() => setShowLocationResults(false), 150)}
              placeholder="Type a place to fill city, country, latitude & longitude"
            />
            {showLocationResults && locationResults.length > 0 && (
              <ListGroup className="position-absolute w-100 shadow-sm" style={{ zIndex: 1000 }}>
                {locationResults.map((result) => (
                  <ListGroup.Item
                    key={`${result.lat},${result.lon}`}
                    action
                    onMouseDown={() => selectLocation(result)}
                  >
                    {result.label}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
            <Form.Text className="text-muted">Powered by OpenStreetMap. City/country/lat/long below stay editable if you need to correct them.</Form.Text>
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control value={form.city} onChange={set('city')} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Country</Form.Label>
                <Form.Control value={form.country} onChange={set('country')} />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Latitude</Form.Label>
                <Form.Control type="number" value={form.latitude} onChange={set('latitude')} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Longitude</Form.Label>
                <Form.Control type="number" value={form.longitude} onChange={set('longitude')} />
              </Form.Group>
            </Col>
          </Row>

          <h6 className="text-uppercase text-muted small mb-3 mt-4">Pricing &amp; Logistics</h6>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Price from</Form.Label>
                <Form.Control type="number" min={0} value={form.price_from} onChange={set('price_from')} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Currency</Form.Label>
                <Form.Select value={form.currency} onChange={setSelect('currency')}>
                  {CURRENCY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Duration</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Select value={form.duration_hours} onChange={setSelect('duration_hours')}>
                    <option value="">Hrs</option>
                    {DURATION_HOUR_OPTIONS.map((o) => <option key={o} value={o}>{o}h</option>)}
                  </Form.Select>
                  <Form.Select value={form.duration_mins} onChange={setSelect('duration_mins')}>
                    <option value="">Mins</option>
                    {DURATION_MIN_OPTIONS.map((o) => <option key={o} value={o}>{o}m</option>)}
                  </Form.Select>
                </div>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Max group size</Form.Label>
                <Form.Control type="number" min={1} value={form.group_size_max} onChange={set('group_size_max')} />
              </Form.Group>
            </Col>
          </Row>

          <h6 className="text-uppercase text-muted small mb-3 mt-4">Schedule</h6>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Schedule type</Form.Label>
                <Form.Select value={form.schedule_type} onChange={setSelect('schedule_type')}>
                  <option value="">Not scheduled (bookable anytime)</option>
                  <option value="one_off">One-off event</option>
                  <option value="recurring">Recurring</option>
                </Form.Select>
              </Form.Group>
            </Col>
            {form.schedule_type === 'one_off' && (
              <>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start date</Form.Label>
                    <Form.Control type="date" value={form.event_start_date} onChange={set('event_start_date')} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>End date (optional)</Form.Label>
                    <Form.Control type="date" value={form.event_end_date} onChange={set('event_end_date')} />
                    <Form.Text className="text-muted">Leave blank for a single-day event.</Form.Text>
                  </Form.Group>
                </Col>
              </>
            )}
          </Row>
          {(form.schedule_type === 'one_off' || form.schedule_type === 'recurring') && (
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Start time</Form.Label>
                  <TimeInput value={form.start_time} onChange={(next) => setForm((f) => ({ ...f, start_time: next }))} />
                </Form.Group>
              </Col>
            </Row>
          )}
          {form.schedule_type === 'recurring' && (
            <>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Runs from</Form.Label>
                    <Form.Control type="date" value={form.recurrence_start_date} onChange={set('recurrence_start_date')} />
                    <Form.Text className="text-muted">Recurrence is anchored to this date.</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Recurrence</Form.Label>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="text-muted">
                    {form.recurrence_type ? formatRecurrenceSummary(recurrenceFieldsForSummary(form)) : 'No recurrence pattern set yet.'}
                  </span>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    size="sm"
                    disabled={!form.recurrence_start_date}
                    onClick={() => setShowRecurrenceModal(true)}
                  >
                    {form.recurrence_type ? 'Edit recurrence' : 'Set recurrence'}
                  </Button>
                </div>
                {!form.recurrence_start_date && (
                  <Form.Text className="text-muted">Set a &quot;Runs from&quot; date first.</Form.Text>
                )}
              </Form.Group>
              <CustomRecurrenceModal
                show={showRecurrenceModal}
                onClose={() => setShowRecurrenceModal(false)}
                onSave={saveRecurrence}
                initial={recurrenceFields}
                startDate={form.recurrence_start_date}
              />
            </>
          )}

          <h6 className="text-uppercase text-muted small mb-3 mt-4">Experience Tags</h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Interest tags</Form.Label>
                <TagPillSelect options={INTEREST_OPTIONS} value={form.interest_tags} onChange={setMulti('interest_tags')} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Social style</Form.Label>
                <TagPillSelect options={socialStyleOptions} value={form.social_style} onChange={setMulti('social_style')} />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Exploration pace</Form.Label>
                <Form.Select value={form.energy_level} onChange={setSelect('energy_level')} disabled={categoriesLoading}>
                  <option value="">{categoriesLoading ? 'Loading…' : 'Select…'}</option>
                  {energyOptions.map((o) => <option key={o.id} value={o.slug}>{o.text}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Budget range</Form.Label>
                <Form.Select value={form.budget_range} onChange={setSelect('budget_range')} disabled={categoriesLoading}>
                  <option value="">{categoriesLoading ? 'Loading…' : 'Select…'}</option>
                  {budgetOptions.map((o) => <option key={o.id} value={o.slug}>{o.text}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Comfort level</Form.Label>
                <Form.Select value={form.comfort_level} onChange={setSelect('comfort_level')} disabled={categoriesLoading}>
                  <option value="">{categoriesLoading ? 'Loading…' : 'Select…'}</option>
                  {comfortOptions.map((o) => <option key={o.id} value={o.slug}>{o.text}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Time of day</Form.Label>
                <Form.Select value={form.time_of_day} onChange={setSelect('time_of_day')}>
                  <option value="">Select…</option>
                  {TIME_OF_DAY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Check
                type="checkbox"
                label="Featured"
                checked={form.is_featured}
                onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
              />
              <Form.Text className="text-muted">Shows a &quot;Featured&quot; badge in the admin list. Doesn&apos;t currently affect sort order or recommendations.</Form.Text>
            </Col>
          </Row>

          <h6 className="text-uppercase text-muted small mb-3 mt-4">What Travellers Get</h6>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>What you&apos;ll do (optional)</Form.Label>
                <Form.Control as="textarea" rows={3} value={form.what_you_will_do} onChange={set('what_you_will_do')} placeholder="One item per line" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>What&apos;s included</Form.Label>
                <Form.Control as="textarea" rows={3} value={form.whats_included} onChange={set('whats_included')} placeholder="One item per line" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>What&apos;s not included</Form.Label>
                <Form.Control as="textarea" rows={3} value={form.whats_not_included} onChange={set('whats_not_included')} placeholder="One item per line" />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Cancellation policy</Form.Label>
            <Form.Control as="textarea" rows={2} value={form.cancellation_policy} onChange={set('cancellation_policy')} />
          </Form.Group>

          <h6 className="text-uppercase text-muted small mb-3 mt-4">Requirements (optional)</h6>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Fitness level</Form.Label>
                <Form.Control value={form.fitness_level} onChange={set('fitness_level')} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Age</Form.Label>
                <Form.Control value={form.age} onChange={set('age')} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Accessibility</Form.Label>
                <Form.Control value={form.accessibility} onChange={set('accessibility')} />
              </Form.Group>
            </Col>
          </Row>

          <h6 className="text-uppercase text-muted small mb-3 mt-4">Safety Info (optional)</h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Risk level</Form.Label>
                <Form.Select value={form.risk_level} onChange={setSelect('risk_level')}>
                  <option value="">None</option>
                  {RISK_LEVEL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mobility accessibility</Form.Label>
                <Form.Select value={form.mobility_accessibility} onChange={setSelect('mobility_accessibility')}>
                  <option value="">UNKNOWN</option>
                  {MOBILITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Safety notes</Form.Label>
                <Form.Control as="textarea" rows={2} value={form.safety_notes} onChange={set('safety_notes')} placeholder="One item per line" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Emergency guidance</Form.Label>
                <Form.Control as="textarea" rows={2} value={form.emergency_guidance} onChange={set('emergency_guidance')} />
              </Form.Group>
            </Col>
          </Row>

          <h6 className="text-uppercase text-muted small mb-3 mt-4">Media &amp; Links</h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Cover image</Form.Label>
                <div className="d-flex align-items-center gap-2 mb-2">
                  {form.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.cover_image_url} alt="Cover preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }} />
                  )}
                  <Form.Control type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                  {isUploadingImage && <Spinner size="sm" />}
                </div>
                <Form.Control value={form.cover_image_url} onChange={set('cover_image_url')} placeholder="https://… (or upload a file above)" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Booking URL</Form.Label>
                <Form.Control value={form.booking_url} onChange={set('booking_url')} placeholder="https://…" />
                <Form.Text className="text-muted">External link where travelers complete booking for this experience (e.g. Viator, GetYourGuide, or the guide&apos;s own booking page).</Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex gap-2 pt-2">
            <Button variant="primary" disabled={!form.title || isPending} onClick={() => mutate()}>
              {isPending ? <Spinner size="sm" /> : (mode === 'edit' ? 'Save changes' : 'Create')}
            </Button>
            <Button variant="outline-secondary" onClick={() => router.back()}>Cancel</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
