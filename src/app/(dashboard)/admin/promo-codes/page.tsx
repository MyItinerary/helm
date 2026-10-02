'use client'

import {
  Badge, Button, Card, CardBody, Col, Form, Modal, Row, Spinner, Table,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { apiErrorDetail, pricingService, type PromoCode } from '@/services/pricing.service'

const CURRENCIES = ['NGN', 'USD', 'GBP']

const emptyPromo = {
  code: '',
  kind: 'percent' as 'percent' | 'fixed',
  value: '',
  currency: 'NGN',
  experience_id: '',
  starts_at: '',
  ends_at: '',
  max_redemptions: '',
  min_subtotal: '',
  platform_share_percent: '100',
}

function fundingLabel(share: string | number): string {
  const platform = Number(share)
  if (platform === 100) return 'MyJourny'
  if (platform === 0) return 'Curator'
  return `MyJourny ${platform}% / Curator ${100 - platform}%`
}

function CreatePromoModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [promo, setPromo] = useState(emptyPromo)
  const queryClient = useQueryClient()
  const set = (key: keyof typeof emptyPromo) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setPromo((p) => ({ ...p, [key]: e.target.value }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => pricingService.createPromoCode({
      code: promo.code.trim(),
      kind: promo.kind,
      value: promo.value,
      currency: promo.kind === 'fixed' ? promo.currency : undefined,
      experience_id: promo.experience_id.trim() || undefined,
      starts_at: promo.starts_at ? new Date(promo.starts_at).toISOString() : undefined,
      ends_at: promo.ends_at ? new Date(promo.ends_at).toISOString() : undefined,
      max_redemptions: promo.max_redemptions ? Number(promo.max_redemptions) : undefined,
      min_subtotal: promo.min_subtotal || undefined,
      platform_share_percent: promo.platform_share_percent,
    }),
    onSuccess: () => {
      toast.success('Promo code created')
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] })
      setPromo(emptyPromo)
      onClose()
    },
    onError: (error) => toast.error(apiErrorDetail(error, 'Could not create the promo code')),
  })

  const share = Number(promo.platform_share_percent || 0)

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton><Modal.Title>New promo code</Modal.Title></Modal.Header>
      <Modal.Body>
        <Row className="g-3">
          <Col md={4}>
            <Form.Label>Code</Form.Label>
            <Form.Control value={promo.code} onChange={set('code')} placeholder="LAUNCH10" className="text-uppercase" />
          </Col>
          <Col md={4}>
            <Form.Label>Discount type</Form.Label>
            <Form.Select value={promo.kind} onChange={set('kind')}>
              <option value="percent">Percentage off</option>
              <option value="fixed">Fixed amount off</option>
            </Form.Select>
          </Col>
          <Col md={promo.kind === 'fixed' ? 2 : 4}>
            <Form.Label>{promo.kind === 'percent' ? '% off' : 'Amount'}</Form.Label>
            <Form.Control type="number" min={0} value={promo.value} onChange={set('value')} />
          </Col>
          {promo.kind === 'fixed' && (
            <Col md={2}>
              <Form.Label>Currency</Form.Label>
              <Form.Select value={promo.currency} onChange={set('currency')}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Form.Select>
            </Col>
          )}
          <Col md={12}>
            <Form.Label>Who pays for the discount</Form.Label>
            <div className="d-flex align-items-center gap-3">
              <Form.Range
                min={0}
                max={100}
                step={5}
                value={share}
                onChange={set('platform_share_percent')}
              />
              <span className="text-nowrap small">{fundingLabel(share)}</span>
            </div>
            <Form.Text className="text-muted">
              MyJourny&apos;s share comes out of commission; the curator&apos;s share comes out of their payout.
            </Form.Text>
          </Col>
          <Col md={6}>
            <Form.Label>Starts</Form.Label>
            <Form.Control type="date" value={promo.starts_at} onChange={set('starts_at')} />
          </Col>
          <Col md={6}>
            <Form.Label>Ends</Form.Label>
            <Form.Control type="date" value={promo.ends_at} onChange={set('ends_at')} />
          </Col>
          <Col md={4}>
            <Form.Label>Max uses</Form.Label>
            <Form.Control type="number" min={1} value={promo.max_redemptions} onChange={set('max_redemptions')} placeholder="Unlimited" />
          </Col>
          <Col md={4}>
            <Form.Label>Minimum booking</Form.Label>
            <Form.Control type="number" min={0} value={promo.min_subtotal} onChange={set('min_subtotal')} placeholder="None" />
          </Col>
          <Col md={4}>
            <Form.Label>Experience ID (optional)</Form.Label>
            <Form.Control value={promo.experience_id} onChange={set('experience_id')} placeholder="All experiences" />
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!promo.code.trim() || !promo.value || isPending} onClick={() => mutate()}>
          {isPending ? <Spinner size="sm" /> : 'Create code'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

const formatValue = (p: PromoCode) =>
  p.kind === 'percent'
    ? `${Number(p.value)}% off`
    : new Intl.NumberFormat('en-NG', { style: 'currency', currency: p.currency ?? 'NGN' }).format(Number(p.value))

const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : '—')

export default function PromoCodesPage() {
  const [showCreate, setShowCreate] = useState(false)
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['promo-codes'], queryFn: pricingService.listPromoCodes })

  const { mutate: toggle, isPending } = useMutation({
    mutationFn: (p: PromoCode) => pricingService.updatePromoCode(p.id, { is_active: !p.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promo-codes'] }),
    onError: (error) => toast.error(apiErrorDetail(error, 'Could not update the promo code')),
  })

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Promo codes</h4>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />New code
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Funded by</th>
                  <th>Uses</th>
                  <th>Valid</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-semibold">{p.code}</td>
                    <td>{formatValue(p)}</td>
                    <td>{fundingLabel(p.platform_share_percent)}</td>
                    <td>{p.redemptions_count}{p.max_redemptions ? ` / ${p.max_redemptions}` : ''}</td>
                    <td className="small">{formatDate(p.starts_at)} – {formatDate(p.ends_at)}</td>
                    <td>
                      <Badge bg={p.is_active ? 'success' : 'secondary'}>{p.is_active ? 'Active' : 'Off'}</Badge>
                    </td>
                    <td className="text-end">
                      <Button size="sm" variant="outline-secondary" disabled={isPending} onClick={() => toggle(p)}>
                        {p.is_active ? 'Turn off' : 'Turn on'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {data?.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted py-4">No promo codes yet.</td></tr>
                )}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <CreatePromoModal show={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
