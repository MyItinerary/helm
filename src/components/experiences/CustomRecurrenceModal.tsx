'use client'

import {
  Button, Form, Modal, Row, Col,
} from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { format, getDate, parseISO } from 'date-fns'
import {
  WEEKDAY_OPTIONS, MONTH_DAY_OPTIONS, getNthWeekdayOfMonth, ordinalLabel, weekdayFullLabel,
  type RecurrenceFrequency, type RecurrenceMonthMode, type RecurrenceEndType,
} from '@/utils/recurrence'
import TagPillSelect from './TagPillSelect'

// Mirrors the recurrence slice of ExperienceForm's all-strings FormState convention, so
// it can be spread straight back into `form` on save with no adapter.
export interface RecurrenceFields {
  recurrence_type: string
  recurrence_interval: string
  recurrence_days: string[]
  recurrence_month_mode: string
  recurrence_month_days: string[]
  recurrence_week_of_month: string
  recurrence_weekday: string
  recurrence_end_type: string
  recurrence_end_date: string
  recurrence_count: string
}

const FREQUENCY_OPTIONS: { id: RecurrenceFrequency; label: string }[] = [
  { id: 'daily', label: 'day' },
  { id: 'weekly', label: 'week' },
  { id: 'monthly', label: 'month' },
  { id: 'yearly', label: 'year' },
]

interface CustomRecurrenceModalProps {
  show: boolean
  onClose: () => void
  onSave: (next: RecurrenceFields) => void
  initial: RecurrenceFields
  startDate: string
}

function isValid(draft: RecurrenceFields, startDate: string): boolean {
  if (!startDate) return false
  if (!draft.recurrence_type) return false
  if (!draft.recurrence_interval || Number(draft.recurrence_interval) < 1) return false
  if (draft.recurrence_type === 'weekly' && draft.recurrence_days.length === 0) return false
  if (draft.recurrence_type === 'monthly') {
    if (!draft.recurrence_month_mode) return false
    if (draft.recurrence_month_mode === 'day_of_month' && draft.recurrence_month_days.length === 0) return false
    if (draft.recurrence_month_mode === 'day_of_week' && (!draft.recurrence_week_of_month || !draft.recurrence_weekday)) return false
  }
  if (draft.recurrence_end_type === 'on_date' && !draft.recurrence_end_date) return false
  if (draft.recurrence_end_type === 'after_occurrences' && (!draft.recurrence_count || Number(draft.recurrence_count) < 1)) return false
  return true
}

export default function CustomRecurrenceModal({
  show, onClose, onSave, initial, startDate,
}: CustomRecurrenceModalProps) {
  const [draft, setDraft] = useState<RecurrenceFields>(initial)

  // Re-seed from the form's committed values every time the dialog opens, so "Cancel"
  // is a true no-op regardless of what was edited during the previous open.
  useEffect(() => {
    if (show) setDraft(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const startDateObj = startDate ? parseISO(startDate) : null
  const dayOfMonthFromStart = startDateObj ? getDate(startDateObj) : null
  const nthWeekdayFromStart = startDateObj ? getNthWeekdayOfMonth(startDateObj) : null

  const setUnit = (unit: RecurrenceFrequency) => {
    setDraft((d) => {
      const next: RecurrenceFields = { ...d, recurrence_type: unit }
      if (unit === 'monthly' && !d.recurrence_month_mode) {
        next.recurrence_month_mode = 'day_of_month'
        next.recurrence_month_days = dayOfMonthFromStart ? [String(dayOfMonthFromStart)] : []
      }
      return next
    })
  }

  const setMonthMode = (mode: RecurrenceMonthMode) => {
    setDraft((d) => {
      if (mode === 'day_of_month') {
        return {
          ...d,
          recurrence_month_mode: mode,
          recurrence_month_days: d.recurrence_month_days.length
            ? d.recurrence_month_days
            : (dayOfMonthFromStart ? [String(dayOfMonthFromStart)] : []),
        }
      }
      return {
        ...d,
        recurrence_month_mode: mode,
        recurrence_week_of_month: nthWeekdayFromStart ? String(nthWeekdayFromStart.ordinal) : '',
        recurrence_weekday: nthWeekdayFromStart ? nthWeekdayFromStart.weekday : '',
      }
    })
  }

  const setEndType = (endType: RecurrenceEndType) => setDraft((d) => ({ ...d, recurrence_end_type: endType }))

  const handleDone = () => {
    onSave(draft)
    onClose()
  }

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Custom recurrence</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!startDate ? (
          <p className="text-muted mb-0">Set a &quot;Runs from&quot; date first — recurrence is anchored to it.</p>
        ) : (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Repeat every</Form.Label>
              <Row className="g-2">
                <Col xs={4}>
                  <Form.Control
                    type="number"
                    min={1}
                    value={draft.recurrence_interval}
                    onChange={(e) => setDraft((d) => ({ ...d, recurrence_interval: e.target.value }))}
                  />
                </Col>
                <Col xs={8}>
                  <Form.Select
                    value={draft.recurrence_type}
                    onChange={(e) => setUnit(e.target.value as RecurrenceFrequency)}
                  >
                    {FREQUENCY_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {pluralizeLabel(o.label, draft.recurrence_interval)}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </Form.Group>

            {draft.recurrence_type === 'weekly' && (
              <Form.Group className="mb-3">
                <Form.Label>Repeat on</Form.Label>
                <TagPillSelect
                  options={WEEKDAY_OPTIONS}
                  value={draft.recurrence_days}
                  onChange={(next) => setDraft((d) => ({ ...d, recurrence_days: next }))}
                />
              </Form.Group>
            )}

            {draft.recurrence_type === 'monthly' && (
              <Form.Group className="mb-3">
                <Form.Select
                  value={draft.recurrence_month_mode}
                  onChange={(e) => setMonthMode(e.target.value as RecurrenceMonthMode)}
                >
                  <option value="day_of_month">
                    {dayOfMonthFromStart ? `Monthly on day ${dayOfMonthFromStart}` : 'Monthly on day…'}
                  </option>
                  <option value="day_of_week">
                    {nthWeekdayFromStart
                      ? `Monthly on the ${ordinalLabel(nthWeekdayFromStart.ordinal)} ${weekdayFullLabel(nthWeekdayFromStart.weekday)}`
                      : 'Monthly on the…'}
                  </option>
                </Form.Select>
                {draft.recurrence_month_mode === 'day_of_month' && (
                  <div className="mt-2">
                    <Form.Text className="text-muted d-block mb-1">
                      Runs on these day(s) of the month:
                    </Form.Text>
                    <TagPillSelect
                      options={MONTH_DAY_OPTIONS}
                      value={draft.recurrence_month_days}
                      onChange={(next) => setDraft((d) => ({ ...d, recurrence_month_days: next }))}
                    />
                  </div>
                )}
              </Form.Group>
            )}

            {draft.recurrence_type === 'yearly' && startDateObj && (
              <p className="text-muted">On {format(startDateObj, 'MMM d')}, every year.</p>
            )}

            <Form.Group className="mb-2">
              <Form.Label>Ends</Form.Label>
              <Form.Check
                type="radio"
                id="recurrence-end-never"
                name="recurrence-end"
                label="Never"
                checked={draft.recurrence_end_type === 'never'}
                onChange={() => setEndType('never')}
              />
              <div className="d-flex align-items-center gap-2 my-1">
                <Form.Check
                  type="radio"
                  id="recurrence-end-on-date"
                  name="recurrence-end"
                  label="On"
                  checked={draft.recurrence_end_type === 'on_date'}
                  onChange={() => setEndType('on_date')}
                />
                <Form.Control
                  type="date"
                  size="sm"
                  style={{ maxWidth: 180 }}
                  disabled={draft.recurrence_end_type !== 'on_date'}
                  value={draft.recurrence_end_date}
                  onChange={(e) => setDraft((d) => ({ ...d, recurrence_end_date: e.target.value }))}
                />
              </div>
              <div className="d-flex align-items-center gap-2">
                <Form.Check
                  type="radio"
                  id="recurrence-end-after"
                  name="recurrence-end"
                  label="After"
                  checked={draft.recurrence_end_type === 'after_occurrences'}
                  onChange={() => setEndType('after_occurrences')}
                />
                <Form.Control
                  type="number"
                  min={1}
                  size="sm"
                  style={{ maxWidth: 90 }}
                  disabled={draft.recurrence_end_type !== 'after_occurrences'}
                  value={draft.recurrence_count}
                  onChange={(e) => setDraft((d) => ({ ...d, recurrence_count: e.target.value }))}
                />
                <span className="text-muted small">occurrences</span>
              </div>
            </Form.Group>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="link" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!isValid(draft, startDate)} onClick={handleDone}>Done</Button>
      </Modal.Footer>
    </Modal>
  )
}

function pluralizeLabel(singular: string, intervalValue: string): string {
  const n = Number(intervalValue) || 1
  return n === 1 ? singular : `${singular}s`
}
