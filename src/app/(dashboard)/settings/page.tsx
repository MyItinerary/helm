'use client'

import {
  Alert, Button, Card, CardBody, CardHeader, Form, Spinner,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faLock } from '@fortawesome/free-solid-svg-icons'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { adminService } from '@/services/admin.service'

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => adminService.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
    }),
    onSuccess: () => {
      toast.success('Password changed')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(message ?? 'Failed to change password')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    mutate()
  }

  const canSubmit = currentPassword && newPassword && confirmPassword && !isPending

  return (
    <Card className="mb-4">
      <CardHeader>
        <FontAwesomeIcon icon={faLock} className="me-2" />
        Change Password
      </CardHeader>
      <CardBody>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Current password</Form.Label>
            <Form.Control
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>New password</Form.Label>
            <Form.Control
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Form.Text className="text-muted">At least 8 characters.</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Confirm new password</Form.Label>
            <Form.Control
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Form.Group>
          <Button type="submit" disabled={!canSubmit}>
            {isPending ? <Spinner size="sm" /> : 'Change Password'}
          </Button>
        </Form>
      </CardBody>
    </Card>
  )
}

export default function SettingsPage() {
  return (
    <div>
      <h4 className="mb-4">Settings</h4>

      <ChangePasswordCard />

      <Card>
        <CardHeader>
          <FontAwesomeIcon icon={faGear} className="me-2" />
          Platform Configuration
        </CardHeader>
        <CardBody>
          <p className="text-muted mb-0">
            Platform settings and configuration options will be available here.
            This section is reserved for future development.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
