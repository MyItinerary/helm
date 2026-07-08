'use client'

import {
  Badge, Button, Card, CardBody, Form, Modal, Spinner, Table,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTrash, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { adminService } from '@/services/admin.service'
import { useAuthStore } from '@/store/auth.store'

function InviteModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => adminService.createAdmin({ email, full_name: fullName || undefined, is_superadmin: isSuperAdmin }),
    onSuccess: () => {
      toast.success('Admin invited')
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      setEmail('')
      setFullName('')
      setIsSuperAdmin(false)
      onClose()
    },
    onError: () => toast.error('Failed to invite admin'),
  })

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Invite Admin</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@myjourny.com"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Name (optional)</Form.Label>
          <Form.Control
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
          />
        </Form.Group>
        <Form.Check
          type="checkbox"
          label="Grant Superadmin privileges"
          checked={isSuperAdmin}
          onChange={(e) => setIsSuperAdmin(e.target.checked)}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!email || isPending} onClick={() => mutate()}>
          {isPending ? <Spinner size="sm" /> : 'Send Invite'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default function TeamPage() {
  const [showInvite, setShowInvite] = useState(false)
  const currentRole = useAuthStore((s) => s.role)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: () => adminService.listAdmins(),
  })

  const { mutate: resendInvite } = useMutation({
    mutationFn: (email: string) => adminService.resendInvite(email),
    onSuccess: () => toast.success('Invite resent'),
    onError: () => toast.error('Failed to resend'),
  })

  const { mutate: deleteAdmin } = useMutation({
    mutationFn: (id: string) => adminService.deleteAdmin(id),
    onSuccess: () => {
      toast.success('Admin removed')
      queryClient.invalidateQueries({ queryKey: ['admins'] })
    },
    onError: () => toast.error('Failed to remove admin'),
  })

  if (currentRole !== 'superadmin') {
    return (
      <div className="text-center py-5">
        <p className="text-muted">You do not have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Admin Management</h4>
        <Button variant="primary" size="sm" onClick={() => setShowInvite(true)}>
          <FontAwesomeIcon icon={faPlus} className="me-1" />
          Invite Admin
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data?.items.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-muted py-4">No admins found</td></tr>
                )}
                {data?.items.map((admin) => (
                  <tr key={admin.id} className="align-middle">
                    <td>{admin.email}</td>
                    <td>{admin.full_name ?? '—'}</td>
                    <td>
                      <Badge bg={admin.is_superadmin ? 'danger' : 'primary'}>
                        {admin.is_superadmin ? 'Superadmin' : 'Admin'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={admin.is_active ? 'success' : 'secondary'}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="text-muted small">{new Date(admin.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          title="Resend invite"
                          onClick={() => resendInvite(admin.email)}
                        >
                          <FontAwesomeIcon icon={faEnvelope} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          title="Remove admin"
                          onClick={() => {
                            if (confirm(`Remove ${admin.email}?`)) deleteAdmin(admin.id)
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <InviteModal show={showInvite} onClose={() => setShowInvite(false)} />
    </div>
  )
}
