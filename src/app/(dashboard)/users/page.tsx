'use client'

import {
  Button, Card, CardBody, CardHeader, Col, Form, Modal, Row, Spinner, Table,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch, faPencil, faXmark, faEye,
} from '@fortawesome/free-solid-svg-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { userService, type DeletionBlockers } from '@/services/user.service'
import StatusBadge from '@/components/ui/StatusBadge'
import type { User } from '@/types'

type SignupType = 'traveller' | 'guide' | 'both'

/** What an admin has to sort out before the account can be deleted. */
function blockerLines(blockers: DeletionBlockers): string[] {
  const lines: string[] = []
  if (blockers.upcoming_bookings) lines.push(`${blockers.upcoming_bookings} upcoming booking(s) as a traveller: cancel them in Bookings.`)
  if (blockers.open_refund_requests) lines.push(`${blockers.open_refund_requests} refund request(s) waiting: resolve them in Refunds.`)
  if (blockers.hosted_upcoming_bookings) lines.push(`${blockers.hosted_upcoming_bookings} upcoming booking(s) on their experiences: cancel or wait for them to finish.`)
  if (blockers.pending_payouts) lines.push(`${blockers.pending_payouts} booking(s) with a payout not yet settled: settle them in Payments & Payouts.`)
  return lines
}

function ViewUserModal({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.get(userId as string),
    enabled: !!userId,
  })
  const [confirming, setConfirming] = useState(false)
  const [blockers, setBlockers] = useState<string[]>([])

  const close = () => {
    setConfirming(false)
    setBlockers([])
    onClose()
  }

  const { mutate: deleteAccount, isPending: deleting } = useMutation({
    mutationFn: () => userService.delete(userId as string),
    onSuccess: () => {
      toast.success('Account deleted: personal details removed, booking and payment records kept')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      close()
    },
    onError: (error) => {
      const response = (error as { response?: { status?: number; data?: { detail?: unknown; blockers?: DeletionBlockers } } }).response
      if (response?.status === 409 && response.data?.blockers) {
        setBlockers(blockerLines(response.data.blockers))
        return
      }
      toast.error(typeof response?.data?.detail === 'string' ? response.data.detail : 'Failed to delete the account')
    },
  })

  return (
    <Modal show={!!userId} onHide={close} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {data?.profile?.full_name || data?.email || 'User'}
          {data?.anonymised_at && <span className="badge bg-secondary ms-2 align-middle fs-6">Deleted</span>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
        ) : !data ? (
          <p className="text-muted mb-0">Not found.</p>
        ) : (
          <>
            <h6 className="text-uppercase text-muted small mb-2">Identity</h6>
            <Row className="mb-3">
              <Col md={6}><strong>Email:</strong> {data.email ?? '—'}</Col>
              <Col md={6}><strong>Signup type:</strong> <span className="text-capitalize">{data.signup_type}</span></Col>
              <Col md={6}><strong>Email verified:</strong> <StatusBadge status={data.is_email_verified ? 'verified' : 'unverified'} /></Col>
              <Col md={6}><strong>Joined:</strong> {new Date(data.created_at).toLocaleDateString()}</Col>
            </Row>

            <h6 className="text-uppercase text-muted small mb-2 mt-3">Profile</h6>
            {!data.profile ? (
              <p className="text-muted mb-3">No profile submitted yet.</p>
            ) : (
              <Row className="mb-3">
                <Col md={6}><strong>Name:</strong> {data.profile.full_name || '—'}</Col>
                <Col md={6}><strong>Home country:</strong> {data.profile.home_country || '—'}</Col>
                <Col md={12} className="mt-2"><strong>Bio:</strong> {data.profile.bio || '—'}</Col>
                <Col md={6} className="mt-2"><strong>Preferred currency:</strong> {data.profile.preferred_currency || '—'}</Col>
                <Col md={6} className="mt-2"><strong>Preferred language:</strong> {data.profile.preferred_language || '—'}</Col>
                <Col md={6} className="mt-2"><strong>Date of birth:</strong> {data.profile.date_of_birth || '—'}</Col>
              </Row>
            )}

            {data.profile && (
              <>
                <h6 className="text-uppercase text-muted small mb-2 mt-3">Travel Preferences</h6>
                <Row className="mb-0">
                  <Col md={4}><strong>Energy level:</strong> {data.profile.energy_level || '—'}</Col>
                  <Col md={4}><strong>Budget range:</strong> {data.profile.budget_range || '—'}</Col>
                  <Col md={4}><strong>Comfort level:</strong> {data.profile.comfort_level || '—'}</Col>
                  <Col md={6} className="mt-2"><strong>Social style:</strong> {data.profile.social_style || '—'}</Col>
                  <Col md={6} className="mt-2"><strong>Interests:</strong> {data.profile.interests?.join(', ') || '—'}</Col>
                  <Col md={12} className="mt-2"><strong>Trip intent:</strong> {data.profile.trip_intent?.join(', ') || '—'}</Col>
                </Row>
              </>
            )}

            {data.anonymised_at && (
              <p className="text-muted small mt-3 mb-0">
                This account was deleted on {new Date(data.anonymised_at).toLocaleDateString()}. Personal details were removed; its bookings and payment records are kept.
              </p>
            )}

            {confirming && (
              <div className="alert alert-danger mt-3 mb-0">
                <strong>Delete this account?</strong>
                <p className="mb-2 mt-1">
                  The user&apos;s personal details (name, email, phone, sign-in, saved lists) are removed for good and they can no longer sign in. Their bookings, payments and refunds are kept, without those details, for compliance, refunds and disputes.
                </p>
                {blockers.length > 0 && (
                  <>
                    <p className="mb-1"><strong>This account can&apos;t be deleted yet:</strong></p>
                    <ul className="mb-2">
                      {blockers.map((line) => <li key={line}>{line}</li>)}
                    </ul>
                  </>
                )}
                <div className="d-flex gap-2">
                  <Button variant="danger" size="sm" disabled={deleting} onClick={() => { setBlockers([]); deleteAccount() }}>
                    {deleting ? <Spinner size="sm" /> : blockers.length > 0 ? 'Try again' : 'Yes, delete account'}
                  </Button>
                  <Button variant="outline-secondary" size="sm" disabled={deleting} onClick={() => { setConfirming(false); setBlockers([]) }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {data && !data.anonymised_at && !confirming && (
          <Button variant="outline-danger" className="me-auto" onClick={() => setConfirming(true)}>
            Delete account…
          </Button>
        )}
        <Button variant="outline-secondary" onClick={close}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

function EditUserModal({
  user,
  onClose,
}: {
  user: User | null
  onClose: () => void
}) {
  const [signupType, setSignupType] = useState<SignupType>('traveller')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [homeCountry, setHomeCountry] = useState('')
  const queryClient = useQueryClient()

  const { data: detail } = useQuery({
    queryKey: ['user', user?.id],
    queryFn: () => userService.get(user!.id),
    enabled: !!user,
  })

  useEffect(() => {
    if (user) {
      setSignupType(user.signup_type as SignupType)
      setEmail(user.email ?? '')
    }
  }, [user])

  useEffect(() => {
    if (detail?.profile) {
      setFullName(detail.profile.full_name ?? '')
      setAvatarUrl(detail.profile.avatar_url ?? '')
      setBio(detail.profile.bio ?? '')
      setHomeCountry(detail.profile.home_country ?? '')
    }
  }, [detail])

  const { mutate, isPending } = useMutation({
    mutationFn: () => userService.update(user!.id, {
      signup_type: signupType,
      email: email || undefined,
      full_name: fullName || undefined,
      avatar_url: avatarUrl || undefined,
      bio: bio || undefined,
      home_country: homeCountry || undefined,
    }),
    onSuccess: () => {
      toast.success('User updated')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] })
      onClose()
    },
    onError: () => toast.error('Update failed'),
  })

  return (
    <Modal show={!!user} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {user && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Signup Type</Form.Label>
              <Form.Select
                value={signupType}
                onChange={(e) => setSignupType(e.target.value as SignupType)}
              >
                <option value="traveller">Traveller</option>
                <option value="guide">Guide</option>
                <option value="both">Both (Traveller + Guide)</option>
              </Form.Select>
              {user.signup_type === 'traveller' && signupType !== 'traveller' && (
                <Form.Text className="text-muted">
                  This creates a guide profile for this user. Fill in their guide details
                  afterward on the Hosts / Curators page.
                </Form.Text>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Full name</Form.Label>
              <Form.Control value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Home country</Form.Label>
              <Form.Control value={homeCountry} onChange={(e) => setHomeCountry(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Avatar URL</Form.Label>
              <Form.Control value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Bio</Form.Label>
              <Form.Control as="textarea" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Form.Group>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          disabled={isPending || !user}
          onClick={() => mutate()}
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => userService.list({ page, limit, search: search || undefined }),
  })

  const commitSearch = () => { setSearch(searchInput); setPage(1) }
  const clearSearch = () => { setSearchInput(''); setSearch(''); setPage(1) }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Users</h4>
        <small className="text-muted">{data?.total ?? 0} total</small>
      </div>

      <Card>
        <CardHeader>
          <Row className="align-items-center">
            <Col md={4}>
              <div className="input-group">
                <span className="input-group-text">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <Form.Control
                  placeholder="Search by name or email... (press Enter)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitSearch() } }}
                />
                {searchInput && (
                  <button type="button" className="btn btn-outline-secondary" onClick={clearSearch} aria-label="Clear search">
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                )}
              </div>
            </Col>
          </Row>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Email</th>
                  <th>Signup Type</th>
                  <th>Email Verified</th>
                  <th>Joined</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">No users found</td>
                  </tr>
                )}
                {data?.items.map((user) => (
                  <tr key={user.id} className="align-middle">
                    <td>
                      {user.anonymised_at
                        ? <span className="text-muted fst-italic">Deleted account</span>
                        : user.email}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark text-capitalize">{user.signup_type}</span>
                    </td>
                    <td>
                      <StatusBadge status={user.is_email_verified ? 'verified' : 'unverified'} />
                    </td>
                    <td className="text-muted small">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          title="View"
                          onClick={() => setViewingId(user.id)}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          title="Edit"
                          onClick={() => setEditingUser(user)}
                        >
                          <FontAwesomeIcon icon={faPencil} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
        {data && data.total > limit && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total}
            </small>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page * limit >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
      <ViewUserModal userId={viewingId} onClose={() => setViewingId(null)} />
    </div>
  )
}
