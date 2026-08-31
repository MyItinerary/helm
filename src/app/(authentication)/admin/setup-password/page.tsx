import { Col, Row } from 'react-bootstrap'
import SetupPasswordForm from '@/app/(authentication)/admin/setup-password/setup-password'

export default function Page({
  searchParams,
}: {
  searchParams: { token?: string; email?: string }
}) {
  return (
    <Row className="justify-content-center align-items-center px-3">
      <Col lg={7} xl={6}>
        <Row>
          <Col md={7} className="bg-white dark:bg-dark border p-5">
            <div className="mb-4">
              <h1 className="h3 mb-1">helm</h1>
              <p className="text-black-50 dark:text-gray-500 mb-0">
                Set your admin password
              </p>
            </div>

            <SetupPasswordForm token={searchParams.token} email={searchParams.email} />
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
