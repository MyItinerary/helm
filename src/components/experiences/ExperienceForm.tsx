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
import type { Experience } from '@/types'
import TagPillSelect from './TagPillSelect'

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
// social_style is a Postgres enum locked to these 4 values — don't add a 5th
// option here without a backend migration. Labels mirror how the mobile
// app's onboarding already collapses 5 UX choices down to these 4 ids.
const SOCIAL_STYLE_OPTIONS = [
  { id: 'solo', label: 'Solo / low-interaction' },
  { id: 'couple', label: 'With a partner' },
  { id: 'group', label: 'Small group (2–4 people)' },
  { id: 'open', label: 'Big group energy' },
]
const ENERGY_OPTIONS = ['chill', 'balanced', 'high']
const BUDGET_OPTIONS = ['low', 'medium', 'high']
const COMFORT_OPTIONS = ['tourist', 'mixed', 'local']
const TIME_OF_DAY_OPTIONS = ['morning', 'afternoon', 'evening', 'night']
const RISK_LEVEL_OPTIONS = ['LOW', 'MEDIUM', 'HIGH']
const MOBILITY_OPTIONS = ['FULL', 'LIMITED', 'UNKNOWN']

const emptyForm = {
  title: '',
  headline: '',
  description: '',
  city: '',
  country: '',
  latitude: '',
  longitude: '',
  price_from: '',
  currency: '',
  duration_minutes: '',
  group_size_min: '',
  group_size_max: '',
  interest_tags: [] as string[],
  energy_level: '',
  budget_range: '',
  social_style: [] as string[],
  comfort_level: '',
  time_of_day: '',
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
  recommended_time_of_day: '',
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
    currency: exp.currency ?? '',
    duration_minutes: exp.duration_minutes != null ? String(exp.duration_minutes) : '',
    group_size_min: exp.group_size_min != null ? String(exp.group_size_min) : '',
    group_size_max: exp.group_size_max != null ? String(exp.group_size_max) : '',
    interest_tags: exp.interest_tags ?? [],
    energy_level: exp.energy_level ?? '',
    budget_range: exp.budget_range ?? '',
    social_style: exp.social_style ?? [],
    comfort_level: exp.comfort_level ?? '',
    time_of_day: exp.time_of_day ?? '',
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
    recommended_time_of_day: exp.safety_info?.recommendedTimeOfDay ?? '',
    mobility_accessibility: exp.safety_info?.mobilityAccessibility ?? '',
    emergency_guidance: exp.safety_info?.emergencyGuidance ?? '',
    cover_image_url: exp.cover_image_url ?? '',
    booking_url: exp.booking_url ?? '',
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
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
        group_size_min: form.group_size_min ? Number(form.group_size_min) : undefined,
        group_size_max: form.group_size_max ? Number(form.group_size_max) : undefined,
        interest_tags: form.interest_tags.length ? form.interest_tags : undefined,
        energy_level: form.energy_level || undefined,
        budget_range: form.budget_range || undefined,
        social_style: form.social_style.length ? form.social_style : undefined,
        comfort_level: form.comfort_level || undefined,
        time_of_day: form.time_of_day || undefined,
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
          recommendedTimeOfDay: form.recommended_time_of_day || undefined,
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

  const setSelect = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const setMulti = (field: 'interest_tags' | 'social_style') => (next: string[]) => setForm((f) => ({ ...f, [field]: next }))

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
                <Form.Label>Headline</Form.Label>
                <Form.Control value={form.headline} onChange={set('headline')} placeholder="A short catchy subtitle" />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} value={form.description} onChange={set('description')} />
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
                <Form.Control value={form.currency} onChange={set('currency')} placeholder="USD" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Duration (min)</Form.Label>
                <Form.Control type="number" min={1} value={form.duration_minutes} onChange={set('duration_minutes')} />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Min group size</Form.Label>
                <Form.Control type="number" min={1} value={form.group_size_min} onChange={set('group_size_min')} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Max group size</Form.Label>
                <Form.Control type="number" min={1} value={form.group_size_max} onChange={set('group_size_max')} />
              </Form.Group>
            </Col>
          </Row>

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
                <TagPillSelect options={SOCIAL_STYLE_OPTIONS} value={form.social_style} onChange={setMulti('social_style')} />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Exploration pace</Form.Label>
                <Form.Select value={form.energy_level} onChange={setSelect('energy_level')}>
                  <option value="">Select…</option>
                  {ENERGY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Budget range</Form.Label>
                <Form.Select value={form.budget_range} onChange={setSelect('budget_range')}>
                  <option value="">Select…</option>
                  {BUDGET_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Comfort level</Form.Label>
                <Form.Select value={form.comfort_level} onChange={setSelect('comfort_level')}>
                  <option value="">Select…</option>
                  {COMFORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
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
                <Form.Label>What you&apos;ll do</Form.Label>
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
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Risk level</Form.Label>
                <Form.Select value={form.risk_level} onChange={setSelect('risk_level')}>
                  <option value="">None</option>
                  {RISK_LEVEL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Mobility accessibility</Form.Label>
                <Form.Select value={form.mobility_accessibility} onChange={setSelect('mobility_accessibility')}>
                  <option value="">UNKNOWN</option>
                  {MOBILITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Recommended time of day</Form.Label>
                <Form.Control value={form.recommended_time_of_day} onChange={set('recommended_time_of_day')} />
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
