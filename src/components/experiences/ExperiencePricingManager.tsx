'use client'

import {
  Badge, Button, Card, CardBody, Col, Form, Row, Spinner, Table,
} from 'react-bootstrap'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  apiErrorDetail, pricingService,
  type Addon, type AddonUnit, type PriceRule, type TicketType, type TicketUnit,
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
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const money = (amount: string | number, currency: string) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(amount))

function describeRule(rule: PriceRule, tickets: TicketType[], currency: string): string {
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

// A ticket type or add-on row, editable in place.
function PriceRow<T extends TicketType | Addon>({
  item, units, currency, onSave, onDelete, saving,
}: {
  item: T
  units: { value: string; label: string }[]
  currency: string
  onSave: (data: { label: string; amount: string; pricing_unit: string }) => void
  onDelete: () => void
  saving: boolean
}) {
  const [label, setLabel] = useState(item.label)
  const [amount, setAmount] = useState(String(Number(item.amount)))
  const [unit, setUnit] = useState<string>(item.pricing_unit)
  const dirty = label !== item.label || Number(amount) !== Number(item.amount) || unit !== item.pricing_unit

  return (
    <tr>
      <td><Form.Control size="sm" value={label} onChange={(e) => setLabel(e.target.value)} /></td>
      <td>
        <Form.Select size="sm" value={unit} onChange={(e) => setUnit(e.target.value)}>
          {units.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
        </Form.Select>
      </td>
      <td>
        <Form.Control size="sm" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Form.Text className="text-muted">{money(amount || 0, currency)}</Form.Text>
      </td>
      <td className="text-end text-nowrap">
        <Button
          size="sm"
          variant="primary"
          className="me-2"
          disabled={!dirty || !label.trim() || amount === '' || saving}
          onClick={() => onSave({ label: label.trim(), amount, pricing_unit: unit })}
        >
          Save
        </Button>
        <Button size="sm" variant="outline-danger" disabled={saving} onClick={onDelete}>Delete</Button>
      </td>
    </tr>
  )
}

function AddPriceRow({
  units, defaultUnit, placeholder, onAdd, saving,
}: {
  units: { value: string; label: string }[]
  defaultUnit: string
  placeholder: string
  onAdd: (data: { label: string; amount: string; pricing_unit: string }) => Promise<boolean>
  saving: boolean
}) {
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState(defaultUnit)

  return (
    <tr>
      <td><Form.Control size="sm" placeholder={placeholder} value={label} onChange={(e) => setLabel(e.target.value)} /></td>
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
          onClick={() => onAdd({ label: label.trim(), amount, pricing_unit: unit }).then((ok) => {
            if (!ok) return
            setLabel('')
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
function toRuleDraft(rule: PriceRule): RuleDraft {
  return {
    kind: rule.kind,
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
  tickets, onSubmit, onCancel, saving, initial,
}: {
  tickets: TicketType[]
  onSubmit: (data: Partial<PriceRule>) => Promise<boolean>
  onCancel?: () => void
  saving: boolean
  initial?: RuleDraft
}) {
  const editing = !!initial
  const [rule, setRule] = useState(initial ?? emptyRule)
  const set = (key: keyof typeof emptyRule) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setRule((r) => ({ ...r, [key]: e.target.value }))
  const toggleDay = (day: number) => setRule((r) => ({
    ...r,
    days_of_week: r.days_of_week.includes(day) ? r.days_of_week.filter((d) => d !== day) : [...r.days_of_week, day],
  }))

  const submit = () => {
    const payload: Partial<PriceRule> = editing
      ? { label: rule.label || null }
      : { kind: rule.kind, label: rule.label || undefined }
    if (!editing && rule.experience_price_id) payload.experience_price_id = rule.experience_price_id
    if (rule.kind === 'group') {
      payload.min_guests = Number(rule.min_guests)
      payload.percent_off = rule.percent_off
    } else if (rule.kind === 'early_bird') {
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

  return (
    <div className="border rounded p-3 mt-3">
      <Row className="g-2 align-items-end">
        <Col md={3}>
          <Form.Label className="small">Rule</Form.Label>
          <Form.Select size="sm" value={rule.kind} onChange={set('kind')} disabled={editing}>
            <option value="group">Group discount</option>
            <option value="early_bird">Early-bird price</option>
            <option value="day_of_week">Day-of-week rate</option>
          </Form.Select>
        </Col>
        {rule.kind !== 'group' && (
          <Col md={3}>
            <Form.Label className="small">Applies to</Form.Label>
            <Form.Select size="sm" value={rule.experience_price_id} onChange={set('experience_price_id')} disabled={editing}>
              <option value="">All ticket types</option>
              {tickets.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Form.Select>
          </Col>
        )}
        {rule.kind === 'group' && (
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
        {rule.kind === 'early_bird' && (
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
        {rule.kind === 'day_of_week' && (
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

// Ticket types, add-ons and pricing rules for one experience. Customers see
// these in the booking panel; the server prices every booking from them.
export default function ExperiencePricingManager({ experienceId }: { experienceId: string }) {
  const queryClient = useQueryClient()
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['experience-pricing', experienceId],
    queryFn: () => pricingService.get(experienceId),
  })

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

  if (isLoading || !data) {
    return <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
  }

  const { currency, prices: tickets, addons, rules } = data
  const toTicket = (d: { label: string; amount: string; pricing_unit: string }) =>
    ({ label: d.label, amount: d.amount, pricing_unit: d.pricing_unit as TicketUnit })
  const toAddon = (d: { label: string; amount: string; pricing_unit: string }) =>
    ({ label: d.label, amount: d.amount, pricing_unit: d.pricing_unit as AddonUnit })

  return (
    <Card className="mt-4">
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="text-uppercase text-muted small mb-0">Pricing</h6>
          <Badge bg="light" text="dark">Prices in {currency}</Badge>
        </div>

        <p className="small text-muted">
          Ticket types customers choose from (e.g. Adult, Child, Student). An experience needs at least one to be bookable.
        </p>
        <Table size="sm" className="align-middle">
          <thead>
            <tr><th>Ticket type</th><th style={{ width: 200 }}>Charged</th><th style={{ width: 180 }}>Price</th><th /></tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <PriceRow
                key={`${t.id}-${t.amount}-${t.label}-${t.pricing_unit}`}
                item={t}
                units={TICKET_UNITS}
                currency={currency}
                saving={isPending}
                onSave={(d) => run(() => pricingService.updateTicket(experienceId, t.id, toTicket(d)))}
                onDelete={() => run(() => pricingService.deleteTicket(experienceId, t.id))}
              />
            ))}
            <AddPriceRow
              units={TICKET_UNITS}
              defaultUnit="per_person"
              placeholder="e.g. Adult"
              saving={isPending}
              onAdd={(d) => run(() => pricingService.createTicket(experienceId, toTicket(d)))}
            />
          </tbody>
        </Table>
        {tickets.length === 0 && (
          <p className="small text-danger">No ticket types yet: customers can&apos;t book this experience.</p>
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
                key={`${a.id}-${a.amount}-${a.label}-${a.pricing_unit}`}
                item={a}
                units={ADDON_UNITS}
                currency={currency}
                saving={isPending}
                onSave={(d) => run(() => pricingService.updateAddon(experienceId, a.id, toAddon(d)))}
                onDelete={() => run(() => pricingService.deleteAddon(experienceId, a.id))}
              />
            ))}
            <AddPriceRow
              units={ADDON_UNITS}
              defaultUnit="per_booking"
              placeholder="e.g. Photography"
              saving={isPending}
              onAdd={(d) => run(() => pricingService.createAddon(experienceId, toAddon(d)))}
            />
          </tbody>
        </Table>

        <h6 className="mt-4">Pricing rules</h6>
        <p className="small text-muted">
          Group discounts, early-bird prices and weekday/weekend rates. A promo code and a group discount don&apos;t stack: the customer gets the better one.
        </p>
        {rules.length === 0 ? (
          <p className="small text-muted fst-italic">No rules.</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {rules.map((r) => (editingRuleId === r.id ? (
              <li key={r.id} className="border-bottom pb-2">
                <RuleForm
                  tickets={tickets}
                  initial={toRuleDraft(r)}
                  saving={isPending}
                  onCancel={() => setEditingRuleId(null)}
                  onSubmit={(d) => run(() => pricingService.updateRule(experienceId, r.id, d)).then((ok) => {
                    if (ok) setEditingRuleId(null)
                    return ok
                  })}
                />
              </li>
            ) : (
              <li key={r.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                <span>
                  {r.label && <strong className="me-2">{r.label}</strong>}
                  {describeRule(r, tickets, currency)}
                </span>
                <span className="text-nowrap">
                  <Button size="sm" variant="outline-secondary" className="me-2" disabled={isPending} onClick={() => setEditingRuleId(r.id)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline-danger" disabled={isPending} onClick={() => run(() => pricingService.deleteRule(experienceId, r.id))}>
                    Delete
                  </Button>
                </span>
              </li>
            )))}
          </ul>
        )}
        <RuleForm tickets={tickets} saving={isPending} onSubmit={(d) => run(() => pricingService.createRule(experienceId, d))} />
      </CardBody>
    </Card>
  )
}
