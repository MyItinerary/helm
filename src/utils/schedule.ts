import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { formatTime12h } from './time'

// IANA zones offered in the experience form. An experience's existing zone is
// always offered too, even if it isn't in this list.
export const TIMEZONE_OPTIONS: { id: string; label: string }[] = [
  { id: 'Africa/Lagos', label: 'Lagos (West Africa, UTC+1)' },
  { id: 'Africa/Accra', label: 'Accra (UTC+0)' },
  { id: 'Africa/Dakar', label: 'Dakar (UTC+0)' },
  { id: 'Africa/Casablanca', label: 'Casablanca' },
  { id: 'Africa/Cairo', label: 'Cairo' },
  { id: 'Africa/Johannesburg', label: 'Johannesburg (UTC+2)' },
  { id: 'Africa/Kigali', label: 'Kigali (UTC+2)' },
  { id: 'Africa/Nairobi', label: 'Nairobi (East Africa, UTC+3)' },
  { id: 'Europe/London', label: 'London' },
  { id: 'Europe/Paris', label: 'Paris / Berlin / Madrid (Central Europe)' },
  { id: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
  { id: 'America/New_York', label: 'New York (US Eastern)' },
  { id: 'America/Chicago', label: 'Chicago (US Central)' },
  { id: 'America/Los_Angeles', label: 'Los Angeles (US Pacific)' },
]

export function timezoneLabel(id?: string | null): string {
  if (!id) return '—'
  return TIMEZONE_OPTIONS.find((o) => o.id === id)?.label ?? id
}

// "HH:MM:SS" (the API's time format) -> "HH:MM" (TimeInput's).
export const shortTime = (value: string) => value.slice(0, 5)

export function formatTimes(times?: string[] | null): string {
  return (times ?? []).map(formatTime12h).join(', ')
}

interface ScheduleShape {
  schedule_type?: string
  event_start_date?: string
  event_end_date?: string
  length_days?: string | number | null
}

/** How many days each session lasts (the server's `session_days`). */
export function sessionLengthDays(s: ScheduleShape): number {
  if (s.schedule_type === 'one_off' && s.event_start_date && s.event_end_date) {
    const days = differenceInCalendarDays(parseISO(s.event_end_date), parseISO(s.event_start_date)) + 1
    return Math.max(days, 1)
  }
  if (s.schedule_type === 'recurring') return Math.max(Number(s.length_days) || 1, 1)
  return 1
}

interface EndShape extends ScheduleShape {
  recurrence_end_type?: string
  recurrence_end_date?: string
  recurrence_count?: string | number | null
}

/**
 * When the schedule's last session ends, as far as the form can tell:
 * a date for one-offs and recurrences ending on a date (the server finds the
 * exact last day), a count for after-N recurrences, or "never".
 */
export function scheduleEndPreview(s: EndShape): string {
  const fmt = (d: string) => format(parseISO(d), 'd MMM yyyy')
  if (s.schedule_type === 'one_off') {
    const last = s.event_end_date || s.event_start_date
    return last ? `Ends ${fmt(last)}` : ''
  }
  if (s.schedule_type !== 'recurring') return ''
  if (s.recurrence_end_type === 'on_date' && s.recurrence_end_date) {
    const days = sessionLengthDays(s)
    return days > 1
      ? `Last session starts by ${fmt(s.recurrence_end_date)} (and runs ${days} days)`
      : `Last session by ${fmt(s.recurrence_end_date)}`
  }
  if (s.recurrence_end_type === 'after_occurrences' && s.recurrence_count) {
    return `Ends after ${s.recurrence_count} session date${Number(s.recurrence_count) === 1 ? '' : 's'}`
  }
  return 'Runs until stopped'
}

const UNIT_SUFFIX: Record<string, string> = {
  per_person: ' / person',
  per_booking: ' / group',
  per_day: ' / person / day',
}

export function formatPriceFrom(exp: { price_from?: number | null; price_unit?: string | null; currency?: string }): string {
  if (exp.price_from == null) return '—'
  return `${exp.currency ?? 'USD'} ${exp.price_from}${UNIT_SUFFIX[exp.price_unit ?? ''] ?? ''}`
}

// itin sends naive UTC timestamps (no "Z"), so mark them as UTC before parsing.
export const parseUtc = (value: string) => new Date(/(Z|[+-]\d\d:?\d\d)$/i.test(value) ? value : `${value}Z`)

/** A UTC session time as wall-clock time in the zone the session runs in. */
export function formatSessionTime(value: string, timeZone = 'Africa/Lagos'): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parseUtc(value))
}

/** "2026-10-31" -> "Sat 31 Oct 2026" */
export const formatLocalDate = (value: string) => format(parseISO(value), 'EEE d MMM yyyy')
