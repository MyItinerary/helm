import {
  format, getDate, getDay, parseISO,
} from 'date-fns'

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type RecurrenceMonthMode = 'day_of_month' | 'day_of_week'
export type RecurrenceEndType = 'never' | 'on_date' | 'after_occurrences'

export interface RecurrenceOption {
  id: string
  label: string
}

// date-fns getDay(): 0 = Sunday .. 6 = Saturday
const WEEKDAY_BY_INDEX: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export const WEEKDAY_OPTIONS: RecurrenceOption[] = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
]

const WEEKDAY_FULL_LABELS: Record<Weekday, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}

export function weekdayFullLabel(id: string): string {
  return WEEKDAY_FULL_LABELS[id as Weekday] ?? id
}

export const MONTH_DAY_OPTIONS: RecurrenceOption[] = Array.from(
  { length: 31 },
  (_, i) => ({ id: String(i + 1), label: String(i + 1) }),
)

const RECURRENCE_UNIT_BY_TYPE: Record<RecurrenceFrequency, string> = {
  daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year',
}

const weekdayOrder = (id: string) => WEEKDAY_OPTIONS.findIndex((o) => o.id === id)

/** Sorts weekday ids (e.g. ['sat', 'mon']) into calendar order (['mon', 'sat']). */
export function sortWeekdays(days: string[]): string[] {
  return [...days].sort((a, b) => weekdayOrder(a) - weekdayOrder(b))
}

/**
 * Which occurrence-in-month a date's weekday is, e.g. 22 Jul 2027 (a Wednesday) is the
 * 4th Wednesday of July. Only collapses to "last" (-1) for a true 5th occurrence — a date
 * that happens to be a month's 4th-and-final occurrence of that weekday still reads as
 * "fourth", matching Google Calendar's behavior.
 */
export function getNthWeekdayOfMonth(date: Date): { ordinal: 1 | 2 | 3 | 4 | -1; weekday: Weekday } {
  const dayOfMonth = getDate(date)
  const weekday = WEEKDAY_BY_INDEX[getDay(date)]
  const rawOrdinal = Math.ceil(dayOfMonth / 7)
  return { ordinal: rawOrdinal >= 5 ? -1 : (rawOrdinal as 1 | 2 | 3 | 4), weekday }
}

export function ordinalLabel(n: 1 | 2 | 3 | 4 | -1): string {
  if (n === -1) return 'last'
  return ['first', 'second', 'third', 'fourth'][n - 1]
}

export function pluralizeUnit(n: number, singular: string): string {
  return `${n} ${n === 1 ? singular : `${singular}s`}`
}

export interface RecurrenceSummaryInput {
  recurrence_type?: RecurrenceFrequency
  recurrence_interval?: number
  recurrence_days?: string[]
  recurrence_month_mode?: RecurrenceMonthMode
  recurrence_month_days?: number[]
  recurrence_week_of_month?: number
  recurrence_weekday?: string
  recurrence_start_date?: string
  recurrence_end_type?: RecurrenceEndType
  recurrence_end_date?: string
  recurrence_count?: number
}

function describePattern(input: RecurrenceSummaryInput): string {
  const { recurrence_type: type } = input
  if (type === 'weekly' && input.recurrence_days?.length) {
    const labels = sortWeekdays(input.recurrence_days)
      .map((id) => WEEKDAY_OPTIONS.find((o) => o.id === id)?.label ?? id)
    return ` on ${labels.join(', ')}`
  }
  if (type === 'monthly' && input.recurrence_month_mode === 'day_of_month' && input.recurrence_month_days?.length) {
    const days = [...input.recurrence_month_days].sort((a, b) => a - b)
    return ` on day ${days.join(', ')}`
  }
  if (
    type === 'monthly'
    && input.recurrence_month_mode === 'day_of_week'
    && input.recurrence_week_of_month
    && input.recurrence_weekday
  ) {
    const ordinal = ordinalLabel(input.recurrence_week_of_month as 1 | 2 | 3 | 4 | -1)
    return ` on the ${ordinal} ${weekdayFullLabel(input.recurrence_weekday)}`
  }
  if (type === 'yearly' && input.recurrence_start_date) {
    return ` on ${format(parseISO(input.recurrence_start_date), 'MMM d')}`
  }
  return ''
}

function describeEndCondition(input: RecurrenceSummaryInput): string {
  if (input.recurrence_end_type === 'on_date' && input.recurrence_end_date) {
    return `, until ${format(parseISO(input.recurrence_end_date), 'd MMM yyyy')}`
  }
  if (input.recurrence_end_type === 'after_occurrences' && input.recurrence_count) {
    return `, ${pluralizeUnit(input.recurrence_count, 'time')}`
  }
  return ', forever'
}

/**
 * Human-readable recurrence summary, e.g. "Repeats every 7 months on day 22, until 22 Jul
 * 2027" or "Repeats monthly on the fourth Wednesday, 12 times". Returns '' if there's no
 * recurrence type set yet — callers should show their own placeholder in that case.
 */
export function formatRecurrenceSummary(input: RecurrenceSummaryInput): string {
  if (!input.recurrence_type) return ''
  const interval = input.recurrence_interval ?? 1
  const unit = RECURRENCE_UNIT_BY_TYPE[input.recurrence_type]
  const frequency = interval === 1 ? `Repeats ${input.recurrence_type}` : `Repeats every ${pluralizeUnit(interval, unit)}`
  return `${frequency}${describePattern(input)}${describeEndCondition(input)}`
}
