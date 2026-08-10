import { format, parse } from 'date-fns'

/**
 * Formats a backend time string ("HH:MM" or "HH:MM:SS", the wire format for a Pydantic
 * `time` field) as a 12-hour clock with AM/PM, e.g. "14:30" -> "2:30 PM". Returns the
 * input unchanged if it doesn't look like a time string, so callers can pass through
 * unexpected values safely rather than crashing on a render.
 */
export function formatTime12h(value: string): string {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value)
  if (!match) return value
  const parsed = parse(`${match[1]}:${match[2]}`, 'HH:mm', new Date())
  return format(parsed, 'h:mm a')
}
