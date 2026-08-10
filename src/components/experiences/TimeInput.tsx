'use client'

import { Form } from 'react-bootstrap'

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1)) // '1'..'12'
const MINUTE_OPTIONS = ['00', '15', '30', '45']
const PERIOD_OPTIONS = ['AM', 'PM'] as const

type Period = typeof PERIOD_OPTIONS[number]

interface TimeParts {
  hour12: string
  minute: string
  period: Period
}

// value/onChange carry the same 24h "HH:MM" string the backend's `time` field expects
// (a native <input type="time">'s DOM value) — this is a drop-in replacement, no payload
// changes needed. Splitting into three plain Form.Selects sidesteps native <input
// type="time">'s OS/browser-locale-dependent display (sometimes 24h regardless of the
// app), since this codebase has no time-picker library installed.
function parseValue(value: string): TimeParts {
  if (!value) return { hour12: '', minute: '', period: 'AM' }
  const [hStr, mStr] = value.split(':')
  const hour24 = Number(hStr)
  const period: Period = hour24 >= 12 ? 'PM' : 'AM'
  let hour12 = hour24 % 12
  if (hour12 === 0) hour12 = 12
  return { hour12: String(hour12), minute: mStr ?? '00', period }
}

function toValue({ hour12, minute, period }: TimeParts): string {
  // Default any still-unset piece so a single field change always produces a concrete
  // value (e.g. picking "PM" first from empty yields 12:00 PM) — otherwise picking
  // fields one at a time from empty would never accumulate, since each intermediate
  // onChange call is derived fresh from the (still-empty) `value` prop.
  const h12 = hour12 || '12'
  const min = minute || '00'
  let hour24 = Number(h12) % 12
  if (period === 'PM') hour24 += 12
  return `${String(hour24).padStart(2, '0')}:${min}`
}

interface TimeInputProps {
  value: string
  onChange: (next: string) => void
}

export default function TimeInput({ value, onChange }: TimeInputProps) {
  const parts = parseValue(value)

  const update = (patch: Partial<TimeParts>) => {
    onChange(toValue({ ...parts, ...patch }))
  }

  return (
    <div className="d-flex gap-2">
      <Form.Select value={parts.hour12} onChange={(e) => update({ hour12: e.target.value })}>
        <option value="">Hour</option>
        {HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
      </Form.Select>
      <Form.Select value={parts.minute} onChange={(e) => update({ minute: e.target.value })}>
        <option value="">Min</option>
        {MINUTE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
      </Form.Select>
      <Form.Select value={parts.period} onChange={(e) => update({ period: e.target.value as Period })}>
        {PERIOD_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
      </Form.Select>
    </div>
  )
}
