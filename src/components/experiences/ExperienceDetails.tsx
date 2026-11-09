import { Badge, Col, Row } from 'react-bootstrap'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Experience } from '@/types'
import { formatRecurrenceSummary } from '@/utils/recurrence'
import { formatPriceFrom, formatTimes, timezoneLabel } from '@/utils/schedule'
import { formatTime12h } from '@/utils/time'

function ExperiencePhotos({ urls }: { urls: string[] }) {
  if (!urls.length) return <p className="text-muted small mb-2">No photos.</p>
  return (
    <div className="d-flex flex-wrap gap-2 mb-2">
      {urls.map((url, i) => (
        <a key={url} href={url} target="_blank" rel="noreferrer" title={i === 0 ? 'Cover photo' : `Photo ${i + 1}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={i === 0 ? 'Cover photo' : `Photo ${i + 1}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 4 }} />
        </a>
      ))}
    </div>
  )
}

// "very_high" reads as "Very high".
const label = (value?: string | null) => (value ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ') : '—')
const note = (value?: string | null) => (value ? ` — ${value}` : '')

function refundLabel(policy?: string | null, hours?: number | null) {
  if (policy === 'full_refund_until') return `Full refund until ${hours ?? '?'} hours before`
  if (policy === 'non_refundable') return 'Non-refundable'
  if (policy === 'custom') return 'Custom'
  return '—'
}

function ItemList({ title, items }: { title: string; items?: string[] | null }) {
  return (
    <Col md={4} className="mb-2">
      <strong>{title}</strong>
      <ul className="small text-muted mb-0 ps-3">
        {items?.length ? items.map((i) => <li key={i}>{i}</li>) : <li>—</li>}
      </ul>
    </Col>
  )
}

// Everything about a listing, as an admin reads it.
export default function ExperienceDetails({ data }: { data: Experience }) {
  return (
    <>
      <h6 className="text-uppercase text-muted small mb-2">Basic Info</h6>
      <Row className="mb-2">
        <Col md={8}><strong>Headline:</strong> {data.headline || '—'}</Col>
        <Col md={4}>
          <StatusBadge status={data.status} />
          {data.is_featured && <Badge bg="warning" className="ms-2">Featured</Badge>}
        </Col>
      </Row>
      <p className="text-muted">{data.description || 'No description'}</p>

      <h6 className="text-uppercase text-muted small mb-2 mt-3">Location</h6>
      <p className="mb-3">
        {[data.city, data.country].filter(Boolean).join(', ') || '—'}
        {data.latitude != null && data.longitude != null && ` (${data.latitude}, ${data.longitude})`}
      </p>

      <h6 className="text-uppercase text-muted small mb-2 mt-3">Schedule</h6>
      <p className="mb-3">
        {!data.schedule_type && 'Not scheduled (bookable anytime)'}
        {data.schedule_type === 'one_off' && (
          <>
            One-off: {data.event_start_date}
            {data.event_end_date && ` – ${data.event_end_date}`}
            {data.start_time && !data.start_times?.length && ` at ${formatTime12h(data.start_time)}`}
          </>
        )}
        {data.schedule_type === 'recurring' && (
          data.recurrence_type ? formatRecurrenceSummary(data) : 'Recurring — no pattern set'
        )}
        {data.schedule_type && data.start_times?.length ? ` · ${formatTimes(data.start_times)}` : null}
        {data.schedule_type === 'recurring' && (data.length_days ?? 1) > 1
          && ` · each session lasts ${data.length_days} days`}
        {data.schedule_type && (
          <span className="d-block text-muted small">
            Time zone: {timezoneLabel(data.timezone)}
            {data.schedule_ends_on && ` · last day ${data.schedule_ends_on}`}
          </span>
        )}
      </p>

      <h6 className="text-uppercase text-muted small mb-2 mt-3">Pricing &amp; Logistics</h6>
      <Row className="mb-3">
        <Col md={4}>
          <strong>Price from:</strong>{' '}
          {formatPriceFrom(data)}
        </Col>
        <Col md={4}><strong>Duration:</strong> {data.duration_minutes ?? '—'} min</Col>
        <Col md={4}><strong>Group size:</strong> {data.group_size_min ?? 1}–{data.group_size_max ?? 'any'}</Col>
      </Row>

      <h6 className="text-uppercase text-muted small mb-2 mt-3">Experience Tags</h6>
      <Row className="mb-3">
        <Col md={6}><strong>Interests:</strong> {data.interest_tags?.join(', ') || '—'}</Col>
        <Col md={6}><strong>Social style:</strong> {data.social_style?.join(', ') || '—'}</Col>
        <Col md={4}><strong>Energy:</strong> {data.energy_level ?? '—'}</Col>
        <Col md={4}><strong>Budget:</strong> {data.budget_range ?? '—'}</Col>
        <Col md={4}><strong>Comfort:</strong> {data.comfort_level ?? '—'}</Col>
        <Col md={12}><strong>Time of day:</strong> {data.time_of_day ?? '—'}</Col>
      </Row>

      <h6 className="text-uppercase text-muted small mb-2 mt-3">Fit and logistics</h6>
      <Row className="mb-3 small">
        <Col md={4}><strong>Fitness:</strong> {label(data.fitness_level)}{note(data.fitness_note)}</Col>
        <Col md={4}>
          <strong>Age:</strong> {label(data.age_policy)}{data.min_age != null ? ` (${data.min_age})` : ''}{note(data.age_note)}
        </Col>
        <Col md={4}><strong>Accessibility:</strong> {label(data.accessibility)}{note(data.accessibility_note)}</Col>
        <Col md={4}><strong>Languages:</strong> {data.languages?.join(', ') || '—'}</Col>
        <Col md={4}><strong>Weather dependent:</strong> {data.weather_dependent ? 'Yes' : 'No'}</Col>
        <Col md={4}><strong>Pickup:</strong> {data.pickup_available ? data.pickup_note || 'Yes' : 'No'}</Col>
        <Col md={12}><strong>Meeting landmark:</strong> {data.meeting_landmark || '—'}</Col>
      </Row>

      <h6 className="text-uppercase text-muted small mb-2 mt-3">What guests get</h6>
      <Row className="mb-3">
        <ItemList title="Highlights" items={data.highlights ?? data.what_you_will_do} />
        <ItemList title="Included" items={data.whats_included} />
        <ItemList title="Not included" items={data.whats_not_included} />
        <ItemList title="What to bring" items={data.what_to_bring_items} />
        <ItemList title="Not suitable for" items={data.not_suitable_for} />
        <ItemList title="Know before you go" items={data.know_before_you_go} />
      </Row>
      <p className="mb-3">
        <strong>Cancellation:</strong> {refundLabel(data.refund_policy, data.free_cancellation_hours)}
        {data.cancellation_policy && <span className="d-block small text-muted">{data.cancellation_policy}</span>}
      </p>

      {data.safety_info && (
        <>
          <h6 className="text-uppercase text-muted small mb-2 mt-3">Safety Info</h6>
          <p className="mb-1">
            Risk: {data.safety_info.riskLevel}
            {data.safety_info.recommendedTimeOfDay && ` · Recommended time: ${data.safety_info.recommendedTimeOfDay}`}
          </p>
          {data.safety_info.notes?.length > 0 && (
            <ul className="small text-muted ps-3">
              {data.safety_info.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}
          {data.safety_info.emergencyGuidance && (
            <p className="small text-muted">{data.safety_info.emergencyGuidance}</p>
          )}
        </>
      )}

      <h6 className="text-uppercase text-muted small mb-2 mt-3">Media &amp; Links</h6>
      <ExperiencePhotos urls={data.images?.length ? data.images : (data.cover_image_url ? [data.cover_image_url] : [])} />
      <p className="mb-0">
        Booking: {data.booking_url ? <a href={data.booking_url} target="_blank" rel="noreferrer">link</a> : '—'}
      </p>
    </>
  )
}
