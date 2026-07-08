import { Col, Row } from 'react-bootstrap'
import LoginForm from '@/app/(authentication)/login/login'

export default function Page({
  searchParams,
}: {
  searchParams: { callbackUrl?: string }
}) {
  const callbackUrl = searchParams.callbackUrl ?? '/'

  return (
    <Row className="justify-content-center align-items-center px-3">
      <Col lg={7} xl={6}>
        <Row>
          <Col md={7} className="bg-white dark:bg-dark border p-5">
            <div className="mb-4">
              <h1 className="h3 mb-1">helm</h1>
              <p className="text-black-50 dark:text-gray-500 mb-0">
                MyJourny Admin Portal
              </p>
            </div>

            <LoginForm callbackUrl={callbackUrl} />
          </Col>
          <Col
            md={5}
            className="d-none d-md-flex bg-primary text-white align-items-center justify-content-center p-5"
          >
            <div className="text-center">
              <h2 className="h4">MyJourny</h2>
              <p className="small opacity-75 mt-2">
                Steer the platform. Manage experiences, bookings, and the entire MyJourny ecosystem.
              </p>
            </div>
          </Col>
        </Row>
      </Col>
    </Row>
  )
}
