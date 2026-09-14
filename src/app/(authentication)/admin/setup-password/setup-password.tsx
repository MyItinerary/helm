'use client'

import {
  Alert, Button, Col, Form, FormControl, InputGroup, Row, Spinner,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import InputGroupText from 'react-bootstrap/InputGroupText'
import { toast } from 'sonner'
import { adminService } from '@/services/admin.service'

const MIN_PASSWORD_LENGTH = 8

interface SetupPasswordFormProps {
  token?: string
  email?: string
}

export default function SetupPasswordForm({ token, email }: SetupPasswordFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  if (!token || !email) {
    return (
      <Alert variant="danger" className="mb-0">
        This setup link is missing required information. Ask a superadmin to send you a
        new invite.
      </Alert>
    )
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const newPassword = formData.get('new_password') as string
    const confirmPassword = formData.get('confirm_password') as string

    setError('')

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await adminService.setupPassword({ token, new_password: newPassword })
      toast.success('Password set — you can log in now')
      router.push('/login')
    } catch (err: unknown) {
      // This link is single-use and expires after 24h — surface the backend's message
      // directly (e.g. "Invalid or expired setup token") rather than a generic error.
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(message ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <p className="text-muted small">
        Setting a password for <strong>{email}</strong>. This link is valid for 24 hours
        and can only be used once.
      </p>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <InputGroup className="mb-3">
          <InputGroupText>
            <FontAwesomeIcon icon={faLock} fixedWidth />
          </InputGroupText>
          <FormControl
            type="password"
            name="new_password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            disabled={submitting}
            placeholder="New password"
            aria-label="New password"
          />
        </InputGroup>

        <InputGroup className="mb-4">
          <InputGroupText>
            <FontAwesomeIcon icon={faLock} fixedWidth />
          </InputGroupText>
          <FormControl
            type="password"
            name="confirm_password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            disabled={submitting}
            placeholder="Confirm password"
            aria-label="Confirm password"
          />
        </InputGroup>

        <Row className="align-items-center">
          <Col xs={6}>
            <Button className="px-4" variant="primary" type="submit" disabled={submitting}>
              {submitting ? <Spinner size="sm" /> : 'Set password'}
            </Button>
          </Col>
        </Row>
      </Form>
    </>
  )
}
