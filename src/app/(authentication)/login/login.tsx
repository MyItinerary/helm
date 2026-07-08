'use client'

import {
  Alert, Button, Col, Form, FormControl, InputGroup, Row, Spinner,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-regular-svg-icons'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import InputGroupText from 'react-bootstrap/InputGroupText'
import { login } from '@/lib/auth'
import { useAuthStore } from '@/store/auth.store'

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    setSubmitting(true)
    setError('')

    try {
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      const { admin, role } = await login(email, password)
      setAuth(admin, role)
      router.push(callbackUrl || '/')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(message ?? 'Invalid credentials. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Form onSubmit={handleLogin}>
        <InputGroup className="mb-3">
          <InputGroupText>
            <FontAwesomeIcon icon={faUser} fixedWidth />
          </InputGroupText>
          <FormControl
            name="email"
            type="email"
            required
            disabled={submitting}
            placeholder="Email address"
            aria-label="Email"
          />
        </InputGroup>

        <InputGroup className="mb-4">
          <InputGroupText>
            <FontAwesomeIcon icon={faLock} fixedWidth />
          </InputGroupText>
          <FormControl
            type="password"
            name="password"
            required
            disabled={submitting}
            placeholder="Password"
            aria-label="Password"
          />
        </InputGroup>

        <Row className="align-items-center">
          <Col xs={6}>
            <Button className="px-4" variant="primary" type="submit" disabled={submitting}>
              {submitting ? <Spinner size="sm" /> : 'Login'}
            </Button>
          </Col>
        </Row>
      </Form>
    </>
  )
}
