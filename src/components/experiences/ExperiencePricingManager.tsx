'use client'

import {
  Alert, Badge, Button, Card, CardBody, Col, Form, Row, Spinner, Table,
} from 'react-bootstrap'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  apiErrorDetail, pricingService,
  type AddonUnit, type GuestType, type PriceRule, type TicketUnit,
} from '@/services/pricing.service'

const TICKET_UNITS: { value: TicketUnit; label: string }[] = [
  { value: 'per_person', label: 'Per person' },
  { value: 'per_booking', label: 'Per booking (flat)' },
  { value: 'per_day', label: 'Per person, per day' },
]
const ADDON_UNITS: { value: AddonUnit; label: string }[] = [
  { value: 'per_booking', label: 'Per booking' },
  { value: 'per_person', label: 'Per person' },
]
const RULE_KINDS: { value: PriceRule['kind']; label: string }[] = [
  { value: 'group', label: 'Group discount' },
  { value: 'early_bird', label: 'Early-bird price' },
  { value: 'day_of_week', label: 'Day-of-week rate' },
]
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const money = (amount: string | number, currency: string) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(amount))

// What the rest of the form says about the experience, which decides the
// pricing that makes sense for it.
export interface PricingContext {
  // Each session lasts more than a day.
  multiDay: boolean
  // It has dated sessions (one-off or recurring), so "book before" means something.
  dated: boolean
  // It repeats, so sessions fall on different weekdays.
  recurring: boolean
}

// Per-day tickets only make sense when a session lasts several days. A ticket
// already using a unit keeps it on the list, so nothing is changed silently.
function ticketUnitsFor(context: PricingContext, current?: string) {
  return TICKET_UNITS.filter((u) => u.value !== 'per_day' || context.multiDay || current === 'per_day')
}

// A group discount counts guests, so it needs a ticket priced per guest.
function countsGuests(tickets: { pricing_unit: string }[]) {
  return tickets.some((t) => t.pricing_unit === 'per_person' || t.pricing_unit === 'per_day')
}

// Early bird is for events only (itin refuses new ones on experiences); it stays
// in RULE_KINDS so older rules still display.
function ruleKindsFor(context: PricingContext, tickets: { pricing_unit: string }[]) {
  return RULE_KINDS.filter((k) => (
    k.value === 'group' ? countsGuests(tickets)
      : k.value === 'day_of_week' ? context.recurring
        : false
  ))
}

// Why a rule doesn't fit the experience as it's set up now, if it doesn't.
function ruleMismatch(rule: Pick<PriceRule, 'kind'>, context: PricingContext, tickets: { pricing_unit: string }[]) {
  if (rule.kind === 'group' && !countsGuests(tickets)) return 'No ticket is priced per guest, so this never applies.'
  if (rule.kind === 'early_bird') return 'Early bird is for events now. Delete this rule; it can\'t be turned back on.'
  if (rule.kind === 'day_of_week' && !context.recurring) return 'The experience doesn\'t repeat, so every session is on the same day.'
  return null
}

type TicketRef = { id: string; label: string }

function describeRule(rule: Partial<PriceRule>, tickets: TicketRef[], currency: string): string {
  const ticket = tickets.find((t) => t.id === rule.experience_price_id)
  const scope = ticket ? ` (${ticket.label} only)` : ''
  if (rule.kind === 'group') {
    return `${Number(rule.percent_off)}% off from ${rule.min_guests} guests`
  }
  if (rule.kind === 'early_bird') {
    const until = rule.book_before ? new Date(rule.book_before).toLocaleDateString() : '?'
    const price = rule.unit_amount != null
      ? money(rule.unit_amount, currency)
      : `${Number(rule.percent_off)}% off`
    return `Early bird: ${price} when booked before ${until}${scope}`
  }
  const days = (rule.days_of_week ?? []).map((d) => WEEKDAYS[d]).join(', ')
  return `${money(rule.unit_amount ?? 0, currency)} on ${days}${scope}`
}

// guest_type: tickets only; '' is a plain ticket such as "Standard".
type PriceDraft = { label: string; description: string; amount: string; pricing_unit: string; guest_type?: string }
type PriceItem = {
  label: string
  description?: string | null
  amount: string | number
  pricing_unit: string
  guest_type?: string | null
}

const GUEST_TYPES = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' },
  { value: 'student', label: 'Student' },
  { value: 'other', label: 'Other' },
]

function GuestTypeSelect({ value, onChange, label }: { value: string, onChange: (v: string) => void, label: string }) {
  return (
    <Form.Select size="sm" className="mt-1" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Any guest</option>
      {GUEST_TYPES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
    </Form.Select>
  )
}

// A ticket type or add-on row, editable in place. The description is shown to
// customers under the label in the booking panel. With `instant`, every change
// is reported straight away (a draft that isn't saved yet) and there's no Save.
function PriceRow({
  item, units, currency, onSave, onDelete, onArchive, onTogglePause, paused, saving, instant, guestTypes,
}: {
  item: PriceItem
  units: { value: string; label: string }[]
  currency: string
  onSave: (data: PriceDraft) => void
  onDelete: () => void
  // Tickets only: stop selling it but keep it on past bookings.
  onArchive?: () => void
  // Add-ons only: stop offering it for now.
  onTogglePause?: () => void
  paused?: boolean
  saving: boolean
  instant?: boolean
  // Tickets only: who the ticket is for.
  guestTypes?: boolean
}) {
  const [label, setLabel] = useState(item.label)
  const [guestType, setGuestType] = useState(item.guest_type ?? '')
  const [description, setDescription] = useState(item.description ?? '')
  const [amount, setAmount] = useState(item.amount === '' ? '' : String(Number(item.amount)))
  const [unit, setUnit] = useState<string>(item.pricing_unit)
  const dirty = label !== item.label
    || description !== (item.description ?? '')
    || Number(amount) !== Number(item.amount)
    || unit !== item.pricing_unit
    || guestType !== (item.guest_type ?? '')
  const change = (next: Partial<PriceDraft>) => {
    const draft = { label, description, amount, pricing_unit: unit, guest_type: guestType, ...next }
    if (next.label !== undefined) setLabel(next.label)
    if (next.description !== undefined) setDescription(next.description)
    if (next.amount !== undefined) setAmount(next.amount)
    if (next.pricing_unit !== undefined) setUnit(next.pricing_unit)
    if (next.guest_type !== undefined) setGuestType(next.guest_type)
    if (instant) onSave({ ...draft, label: draft.label.trim(), description: draft.description.trim() })
  }

  return (
    <tr className={paused ? 'text-muted' : undefined}>
      <td>
        <Form.Control size="sm" aria-label="Name" value={label} onChange={(e) => change({ label: e.target.value })} />
        <Form.Control
          size="sm"
          className="mt-1"
          aria-label="Description"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => change({ description: e.target.value })}
        />
        {guestTypes && <GuestTypeSelect label="Guest type" value={guestType} onChange={(guest_type) => change({ guest_type })} />}
        {paused && <Badge bg="secondary" className="mt-1">Paused: not offered to customers</Badge>}
      </td>
      <td>
        <Form.Select size="sm" value={unit} onChange={(e) => change({ pricing_unit: e.target.value })}>
          {units.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
        </Form.Select>
      </td>
      <td>
        <Form.Control
          size="sm"
          type="number"
          min={0}
          placeholder="Price"
          aria-label="Price"
          isInvalid={instant && amount === ''}
          value={amount}
          onChange={(e) => change({ amount: e.target.value })}
        />
        {amount !== '' && <Form.Text className="text-muted">{money(amount, currency)}</Form.Text>}
      </td>
      <td className="text-end text-nowrap">
        {!instant && (
          <Button
            size="sm"
            variant="primary"
            className="me-2"
            disabled={!dirty || !label.trim() || amount === '' || saving}
            onClick={() => onSave({
              label: label.trim(), description: description.trim(), amount, pricing_unit: unit, guest_type: guestType,
            })}
          >
            Save
          </Button>
        )}
        {onArchive && (
          <Button
            size="sm"
            variant="outline-secondary"
            className="me-2"
            disabled={saving}
            title="Stop selling it. Past bookings keep it."
            onClick={onArchive}
          >
            Archive
          </Button>
        )}
        {onTogglePause && (
          <Button size="sm" variant="outline-secondary" className="me-2" disabled={saving} onClick={onTogglePause}>
            {paused ? 'Turn on' : 'Pause'}
          </Button>
        )}
        <Button size="sm" variant="outline-danger" disabled={saving} onClick={onDelete}>Delete</Button>
      </td>
    </tr>
  )
}

function AddPriceRow({
  units, defaultUnit, placeholder, onAdd, saving, guestTypes,
}: {
  units: { value: string; label: string }[]
  defaultUnit: string
  placeholder: string
  onAdd: (data: PriceDraft) => Promise<boolean>
  saving: boolean
  guestTypes?: boolean
}) {
  const [guestType, setGuestType] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState(defaultUnit)

  return (
    <tr>
      <td>
        <Form.Control size="sm" aria-label="New name" placeholder={placeholder} value={label} onChange={(e) => setLabel(e.target.value)} />
        <Form.Control
          size="sm"
          className="mt-1"
          aria-label="New description"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {guestTypes && <GuestTypeSelect label="New guest type" value={guestType} onChange={setGuestType} />}
      </td>
      <td>
        <Form.Select size="sm" value={unit} onChange={(e) => setUnit(e.target.value)}>
          {units.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
        </Form.Select>
      </td>
      <td><Form.Control size="sm" type="number" min={0} placeholder="Price" value={amount} onChange={(e) => setAmount(e.target.value)} /></td>
      <td className="text-end">
        <Button
          size="sm"
          variant="outline-primary"
          disabled={!label.trim() || amount === '' || saving}
          onClick={() => onAdd({
            label: label.trim(), description: description.trim(), amount, pricing_unit: unit, guest_type: guestType,
          }).then((ok) => {
            if (!ok) return
            setGuestType('')
            setLabel('')
            setDescription('')
            setAmount('')
          })}
        >
          Add
        </Button>
      </td>
    </tr>
  )
}

const emptyRule = {
  kind: 'group' as PriceRule['kind'],
  experience_price_id: '',
  label: '',
  unit_amount: '',
  percent_off: '',
  book_before: '',
  days_of_week: [] as number[],
  min_guests: '',
}

type RuleDraft = typeof emptyRule

// A saved rule as form values. Dates come back as ISO timestamps.
function toRuleDraft(rule: Partial<PriceRule>): RuleDraft {
  return {
    kind: rule.kind ?? 'group',
    experience_price_id: rule.experience_price_id ?? '',
    label: rule.label ?? '',
    unit_amount: rule.unit_amount != null ? String(Number(rule.unit_amount)) : '',
    percent_off: rule.percent_off != null ? String(Number(rule.percent_off)) : '',
    book_before: rule.book_before ? rule.book_before.slice(0, 10) : '',
    days_of_week: rule.days_of_week ?? [],
    min_guests: rule.min_guests != null ? String(rule.min_guests) : '',
  }
}

// Adds a rule, or edits one when `initial` is given. A rule's type and the
// ticket it applies to can't change after it's created (delete and re-add).
function RuleForm({
  tickets, kinds, onSubmit, onCancel, saving, initial,
}: {
  tickets: TicketRef[]
  kinds: { value: PriceRule['kind']; label: string }[]
  onSubmit: (data: Partial<PriceRule>) => Promise<boolean>
  onCancel?: () => void
  saving: boolean
  initial?: RuleDraft
}) {
  const editing = !!initial
  const [rule, setRule] = useState(initial ?? emptyRule)
  // The type picked can stop fitting when the schedule or tickets change.
  const kind = editing || kinds.some((k) => k.value === rule.kind) ? rule.kind : kinds[0]?.value
  const set = (key: keyof typeof emptyRule) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setRule((r) => ({ ...r, [key]: e.target.value }))
  const toggleDay = (day: number) => setRule((r) => ({
    ...r,
    days_of_week: r.days_of_week.includes(day) ? r.days_of_week.filter((d) => d !== day) : [...r.days_of_week, day],
  }))

  const submit = () => {
    const payload: Partial<PriceRule> = editing
      ? { label: rule.label || null }
      : { kind, label: rule.label || undefined }
    if (!editing && rule.experience_price_id) payload.experience_price_id = rule.experience_price_id
    if (kind === 'group') {
      payload.min_guests = Number(rule.min_guests)
      payload.percent_off = rule.percent_off
    } else if (kind === 'early_bird') {
      payload.book_before = rule.book_before ? new Date(rule.book_before).toISOString() : undefined
      // A price or a percentage, never both: an edit that switches clears the other.
      payload.unit_amount = rule.unit_amount || null
      payload.percent_off = rule.unit_amount ? null : rule.percent_off
    } else {
      payload.days_of_week = rule.days_of_week
      payload.unit_amount = rule.unit_amount
    }
    return onSubmit(payload).then((ok) => ok && !editing && setRule(emptyRule))
  }

  if (!kind) {
    return (
      <p className="small text-muted fst-italic mt-3 mb-0">
        No discounts fit this experience yet: a group discount needs a ticket priced per guest, and a day-of-week rate
        needs a repeating schedule. For a time-limited offer, use a promo code.
      </p>
    )
  }

  return (
    <div className="border rounded p-3 mt-3">
      <Row className="g-2 align-items-end">
        <Col md={3}>
          <Form.Label className="small">Rule</Form.Label>
          <Form.Select size="sm" value={kind} onChange={set('kind')} disabled={editing}>
            {(editing ? RULE_KINDS : kinds).map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </Form.Select>
        </Col>
        {kind !== 'group' && (
          <Col md={3}>
            <Form.Label className="small">Applies to</Form.Label>
            <Form.Select size="sm" value={rule.experience_price_id} onChange={set('experience_price_id')} disabled={editing}>
              <option value="">All ticket types</option>
              {tickets.map((t) => <option key={t.id} value={t.id}>{t.label || 'Unnamed ticket'}</option>)}
            </Form.Select>
          </Col>
        )}
        {kind === 'group' && (
          <>
            <Col md={2}>
              <Form.Label className="small">From guests</Form.Label>
              <Form.Control size="sm" type="number" min={2} value={rule.min_guests} onChange={set('min_guests')} />
            </Col>
            <Col md={2}>
              <Form.Label className="small">% off</Form.Label>
              <Form.Control size="sm" type="number" min={1} max={100} value={rule.percent_off} onChange={set('percent_off')} />
            </Col>
          </>
        )}
        {kind === 'early_bird' && (
          <>
            <Col md={2}>
              <Form.Label className="small">Book before</Form.Label>
              <Form.Control size="sm" type="date" value={rule.book_before} onChange={set('book_before')} />
            </Col>
            <Col md={2}>
              <Form.Label className="small">Price</Form.Label>
              <Form.Control size="sm" type="number" min={0} value={rule.unit_amount} onChange={set('unit_amount')} disabled={!!rule.percent_off} />
            </Col>
            <Col md={2}>
              <Form.Label className="small">or % off</Form.Label>
              <Form.Control size="sm" type="number" min={1} max={100} value={rule.percent_off} onChange={set('percent_off')} disabled={!!rule.unit_amount} />
            </Col>
          </>
        )}
        {kind === 'day_of_week' && (
          <>
            <Col md={4}>
              <Form.Label className="small d-block">Days</Form.Label>
              {WEEKDAYS.map((day, i) => (
                <Form.Check
                  key={day}
                  inline
                  type="checkbox"
                  id={`rule-day-${editing ? 'edit' : 'new'}-${i}`}
                  label={day}
                  checked={rule.days_of_week.includes(i)}
                  onChange={() => toggleDay(i)}
                />
              ))}
            </Col>
            <Col md={2}>
              <Form.Label className="small">Price</Form.Label>
              <Form.Control size="sm" type="number" min={0} value={rule.unit_amount} onChange={set('unit_amount')} />
            </Col>
          </>
        )}
        <Col md={2}>
          <Form.Label className="small">Label (optional)</Form.Label>
          <Form.Control size="sm" placeholder="e.g. Weekend" value={rule.label} onChange={set('label')} />
        </Col>
        <Col md="auto" className="d-flex gap-2">
          <Button size="sm" variant={editing ? 'primary' : 'outline-primary'} disabled={saving} onClick={submit}>
            {editing ? 'Save rule' : 'Add rule'}
          </Button>
          {onCancel && <Button size="sm" variant="link" onClick={onCancel}>Cancel</Button>}
        </Col>
      </Row>
    </div>
  )
}

type Rule = Partial<PriceRule> & { id: string; kind: PriceRule['kind'] }
type Ticket = PriceItem & { id: string; is_active?: boolean }
type AddonItem = PriceItem & { id: string; is_active?: boolean }

// The ticket, add-on and rule lists, shared by the live card on the edit page
// and the draft on the create page. Only the handlers differ.
function PricingSections({
  currency, context, tickets, archived = [], addons, rules, saving, instant, on,
}: {
  currency: string
  context: PricingContext
  tickets: Ticket[]
  archived?: Ticket[]
  addons: AddonItem[]
  rules: Rule[]
  saving: boolean
  instant?: boolean
  on: {
    saveTicket: (t: Ticket, d: PriceDraft) => void
    addTicket: (d: PriceDraft) => Promise<boolean>
    deleteTicket: (t: Ticket) => void
    archiveTicket?: (t: Ticket) => void
    restoreTicket?: (t: Ticket) => void
    saveAddon: (a: AddonItem, d: PriceDraft) => void
    addAddon: (d: PriceDraft) => Promise<boolean>
    deleteAddon: (a: AddonItem) => void
    toggleAddon?: (a: AddonItem) => void
    addRule: (d: Partial<PriceRule>) => Promise<boolean>
    updateRule: (r: Rule, d: Partial<PriceRule>) => Promise<boolean>
    deleteRule: (r: Rule) => void
    toggleRule?: (r: Rule) => void
  }
}) {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const allTickets = [...tickets, ...archived]
  const kinds = ruleKindsFor(context, tickets)

  return (
    <>
      <p className="small text-muted">
        Guest types customers choose from (e.g. Adult, Child, Student), each with its own price. An experience needs at least one to be bookable.
        {context.multiDay && ' Sessions last several days, so a ticket can be charged per person, per day.'}
      </p>
      <Table size="sm" className="align-middle">
        <thead>
          <tr><th>Guest type</th><th style={{ width: 200 }}>Charged</th><th style={{ width: 180 }}>Price</th><th /></tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <PriceRow
              key={instant ? t.id : `${t.id}-${t.amount}-${t.label}-${t.pricing_unit}-${t.description ?? ''}-${t.guest_type ?? ''}`}
              item={t}
              units={ticketUnitsFor(context, t.pricing_unit)}
              currency={currency}
              saving={saving}
              instant={instant}
              guestTypes
              onSave={(d) => on.saveTicket(t, d)}
              onArchive={on.archiveTicket && (() => on.archiveTicket?.(t))}
              onDelete={() => on.deleteTicket(t)}
            />
          ))}
          <AddPriceRow
            units={ticketUnitsFor(context)}
            defaultUnit="per_person"
            placeholder="e.g. Adult"
            saving={saving}
            guestTypes
            onAdd={on.addTicket}
          />
        </tbody>
      </Table>
      {tickets.length === 0 && (
        <p className="small text-danger">No ticket types on sale: customers can&apos;t book this experience.</p>
      )}
      {tickets.some((t) => t.pricing_unit === 'per_day') && !context.multiDay && (
        <p className="small text-warning">A per-day ticket on a one-day experience is charged for one day.</p>
      )}
      {on.archiveTicket && (
        <p className="small text-muted">
          A ticket type that has bookings can&apos;t be deleted. Archive it instead: customers stop seeing it, and past bookings keep it.
        </p>
      )}
      {archived.length > 0 && (
        <>
          <div className="small fw-semibold text-muted mb-1">Archived</div>
          <ul className="list-unstyled small mb-0">
            {archived.map((t) => (
              <li key={t.id} className="d-flex justify-content-between align-items-center border-bottom py-1 text-muted">
                <span>
                  {t.label} · {money(t.amount, currency)} {TICKET_UNITS.find((u) => u.value === t.pricing_unit)?.label.toLowerCase()}
                </span>
                <Button size="sm" variant="outline-secondary" disabled={saving} onClick={() => on.restoreTicket?.(t)}>
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h6 className="mt-4">Add-ons</h6>
      <p className="small text-muted">Optional extras customers can add at checkout (meal, photography, transport).</p>
      <Table size="sm" className="align-middle">
        <thead>
          <tr><th>Add-on</th><th style={{ width: 200 }}>Charged</th><th style={{ width: 180 }}>Price</th><th /></tr>
        </thead>
        <tbody>
          {addons.map((a) => (
            <PriceRow
              key={instant ? a.id : `${a.id}-${a.amount}-${a.label}-${a.pricing_unit}-${a.description ?? ''}-${a.is_active}`}
              item={a}
              units={ADDON_UNITS}
              currency={currency}
              saving={saving}
              instant={instant}
              paused={a.is_active === false}
              onSave={(d) => on.saveAddon(a, d)}
              onTogglePause={on.toggleAddon && (() => on.toggleAddon?.(a))}
              onDelete={() => on.deleteAddon(a)}
            />
          ))}
          <AddPriceRow
            units={ADDON_UNITS}
            defaultUnit="per_booking"
            placeholder="e.g. Photography"
            saving={saving}
            onAdd={on.addAddon}
          />
        </tbody>
      </Table>

      <h6 className="mt-4">Discounts &amp; pricing rules</h6>
      <p className="small text-muted">
        Group discounts and weekday/weekend rates. Discounts don&apos;t stack: the customer gets the single biggest one they qualify for (group, day-of-week or promo code). A group discount counts every ticket type together, and doesn&apos;t stop smaller bookings; for that, set the experience&apos;s min group size.
      </p>
      {rules.length === 0 ? (
        <p className="small text-muted fst-italic">No rules.</p>
      ) : (
        <ul className="list-unstyled mb-0">
          {rules.map((r) => {
            const mismatch = ruleMismatch(r, context, tickets)
            const paused = r.is_active === false
            const earlyBird = r.kind === 'early_bird'
            return editingRuleId === r.id ? (
              <li key={r.id} className="border-bottom pb-2">
                <RuleForm
                  tickets={allTickets}
                  kinds={RULE_KINDS}
                  initial={toRuleDraft(r)}
                  saving={saving}
                  onCancel={() => setEditingRuleId(null)}
                  onSubmit={(d) => on.updateRule(r, d).then((ok) => {
                    if (ok) setEditingRuleId(null)
                    return ok
                  })}
                />
              </li>
            ) : (
              <li key={r.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                <span className={paused ? 'text-muted' : undefined}>
                  {r.label && <strong className="me-2">{r.label}</strong>}
                  {describeRule(r, allTickets, currency)}
                  {paused && <Badge bg="secondary" className="ms-2">Paused</Badge>}
                  {mismatch && <span className="d-block small text-warning">{mismatch}</span>}
                </span>
                <span className="text-nowrap">
                  {on.toggleRule && !(earlyBird && paused) && (
                    <Button size="sm" variant="outline-secondary" className="me-2" disabled={saving} onClick={() => on.toggleRule?.(r)}>
                      {paused ? 'Turn on' : 'Pause'}
                    </Button>
                  )}
                  {!earlyBird && (
                    <Button size="sm" variant="outline-secondary" className="me-2" disabled={saving} onClick={() => setEditingRuleId(r.id)}>
                      Edit
                    </Button>
                  )}
                  <Button size="sm" variant="outline-danger" disabled={saving} onClick={() => on.deleteRule(r)}>
                    Delete
                  </Button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
      <RuleForm tickets={tickets} kinds={kinds} saving={saving} onSubmit={on.addRule} />
    </>
  )
}

// --- Draft pricing, for an experience that isn't created yet ---------------

export interface PricingDraft {
  tickets: Ticket[]
  addons: AddonItem[]
  rules: Rule[]
}

let draftIds = 0
const draftId = () => `draft-${++draftIds}`

export function newPricingDraft(): PricingDraft {
  return {
    tickets: [{ id: draftId(), label: 'Standard', description: '', amount: '', pricing_unit: 'per_person' }],
    addons: [],
    rules: [],
  }
}

// What's stopping the draft from being saved, if anything.
export function pricingDraftProblem(draft: PricingDraft): string | null {
  if (draft.tickets.length === 0) return 'Add at least one ticket type so customers can book.'
  if (draft.tickets.some((t) => !t.label.trim() || t.amount === '')) return 'Give every ticket type a name and a price.'
  if (draft.addons.some((a) => !a.label.trim() || a.amount === '')) return 'Give every add-on a name and a price.'
  return null
}

// The create request's pricing fields. A rule for one ticket names it by its
// position, since the ticket has no id until the experience is saved.
export function pricingDraftPayload(draft: PricingDraft) {
  const strip = ({ label, description, amount, pricing_unit }: PriceItem) =>
    ({ label, description: description || null, amount, pricing_unit })
  return {
    prices: draft.tickets.map((t) => ({ ...strip(t), guest_type: t.guest_type || null })),
    addons: draft.addons.map(strip),
    price_rules: draft.rules.map(({ id: _id, experience_price_id, ...rule }) => {
      const index = draft.tickets.findIndex((t) => t.id === experience_price_id)
      return { ...rule, ticket_index: index >= 0 ? index : undefined }
    }),
  }
}

// The Pricing section of the create page. Nothing is saved until Create.
export function PricingDraftEditor({
  value, onChange, currency, context,
}: {
  value: PricingDraft
  onChange: (next: PricingDraft) => void
  currency: string
  context: PricingContext
}) {
  const update = (patch: Partial<PricingDraft>) => onChange({ ...value, ...patch })
  const fromDraft = (d: PriceDraft) => ({
    label: d.label, description: d.description, amount: d.amount, pricing_unit: d.pricing_unit, guest_type: d.guest_type ?? '',
  })

  return (
    <div id="pricing" className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="text-uppercase text-muted small mb-0">Pricing</h6>
        <Badge bg="light" text="dark">Prices in {currency}</Badge>
      </div>
      <PricingSections
        currency={currency}
        context={context}
        tickets={value.tickets}
        addons={value.addons}
        rules={value.rules}
        saving={false}
        instant
        on={{
          saveTicket: (t, d) => update({ tickets: value.tickets.map((x) => (x.id === t.id ? { ...x, ...fromDraft(d) } : x)) }),
          addTicket: async (d) => {
            update({ tickets: [...value.tickets, { id: draftId(), ...fromDraft(d) }] })
            return true
          },
          deleteTicket: (t) => {
            const dropped = value.rules.filter((r) => r.experience_price_id === t.id).length
            if (dropped) toast.info(`Removed ${dropped} rule${dropped === 1 ? '' : 's'} for ${t.label || 'that ticket'}`)
            update({
              tickets: value.tickets.filter((x) => x.id !== t.id),
              rules: value.rules.filter((r) => r.experience_price_id !== t.id),
            })
          },
          saveAddon: (a, d) => update({ addons: value.addons.map((x) => (x.id === a.id ? { ...x, ...fromDraft(d) } : x)) }),
          addAddon: async (d) => {
            update({ addons: [...value.addons, { id: draftId(), ...fromDraft(d) }] })
            return true
          },
          deleteAddon: (a) => update({ addons: value.addons.filter((x) => x.id !== a.id) }),
          addRule: async (d) => {
            update({ rules: [...value.rules, { ...d, id: draftId(), kind: d.kind ?? 'group' }] })
            return true
          },
          updateRule: async (r, d) => {
            update({ rules: value.rules.map((x) => (x.id === r.id ? { ...x, ...d } : x)) })
            return true
          },
          deleteRule: (r) => update({ rules: value.rules.filter((x) => x.id !== r.id) }),
        }}
      />
    </div>
  )
}

// --- Live pricing, for a saved experience ----------------------------------

// Ticket types, add-ons and pricing rules for one experience. Customers see
// these in the booking panel; the server prices every booking from them.
export default function ExperiencePricingManager({
  experienceId, context,
}: {
  experienceId: string
  context: PricingContext
}) {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['experience-pricing', experienceId],
    queryFn: () => pricingService.get(experienceId, { includeArchived: true }),
  })

  // The card loads after navigation, so a #pricing link can't scroll to it on
  // its own.
  const loaded = !!data
  useEffect(() => {
    if (loaded && window.location.hash === '#pricing') {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [loaded])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['experience-pricing', experienceId] })
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: () => {
      toast.success('Pricing updated')
      refresh()
    },
    onError: (error) => toast.error(apiErrorDetail(error, 'Could not update pricing')),
  })
  // Resolves to whether it worked; errors are already shown as a toast.
  const run = (action: () => Promise<unknown>) =>
    mutateAsync(action).then(() => true, () => false)

  if (isError) {
    return (
      <Alert id="pricing" variant="danger" className="mt-4 d-flex justify-content-between align-items-center">
        <span>Couldn&apos;t load pricing: {apiErrorDetail(error, 'unknown error')}</span>
        <Button size="sm" variant="outline-danger" disabled={isFetching} onClick={() => refetch()}>
          {isFetching ? <Spinner size="sm" /> : 'Retry'}
        </Button>
      </Alert>
    )
  }

  if (isLoading || !data) {
    return <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
  }

  const { currency, prices: allTickets, addons, rules } = data
  // Older servers don't send is_active; their tickets are all on sale.
  const tickets = allTickets.filter((t) => t.is_active !== false)
  const archived = allTickets.filter((t) => t.is_active === false)
  // An empty description clears it.
  const toTicket = (d: PriceDraft) => ({
    label: d.label,
    description: d.description || null,
    amount: d.amount,
    pricing_unit: d.pricing_unit as TicketUnit,
    guest_type: (d.guest_type || null) as GuestType | null,
  })
  const toAddon = (d: PriceDraft) =>
    ({ label: d.label, description: d.description || null, amount: d.amount, pricing_unit: d.pricing_unit as AddonUnit })

  return (
    <Card id="pricing" className="mt-4">
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="text-uppercase text-muted small mb-0">Pricing</h6>
          <Badge bg="light" text="dark">Prices in {currency}</Badge>
        </div>
        <PricingSections
          currency={currency}
          context={context}
          tickets={tickets}
          archived={archived}
          addons={addons}
          rules={rules}
          saving={isPending}
          on={{
            saveTicket: (t, d) => run(() => pricingService.updateTicket(experienceId, t.id, toTicket(d))),
            addTicket: (d) => run(() => pricingService.createTicket(experienceId, toTicket(d))),
            deleteTicket: (t) => run(() => pricingService.deleteTicket(experienceId, t.id)),
            archiveTicket: (t) => run(() => pricingService.updateTicket(experienceId, t.id, { is_active: false })),
            restoreTicket: (t) => run(() => pricingService.updateTicket(experienceId, t.id, { is_active: true })),
            saveAddon: (a, d) => run(() => pricingService.updateAddon(experienceId, a.id, toAddon(d))),
            addAddon: (d) => run(() => pricingService.createAddon(experienceId, toAddon(d))),
            deleteAddon: (a) => run(() => pricingService.deleteAddon(experienceId, a.id)),
            toggleAddon: (a) => run(() => pricingService.updateAddon(experienceId, a.id, { is_active: a.is_active === false })),
            addRule: (d) => run(() => pricingService.createRule(experienceId, d)),
            updateRule: (r, d) => run(() => pricingService.updateRule(experienceId, r.id, d)),
            deleteRule: (r) => run(() => pricingService.deleteRule(experienceId, r.id)),
            toggleRule: (r) => run(() => pricingService.updateRule(experienceId, r.id, { is_active: r.is_active === false })),
          }}
        />
      </CardBody>
    </Card>
  )
}
