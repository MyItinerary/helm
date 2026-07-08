'use client'

import { Breadcrumb as BSBreadcrumb, BreadcrumbItem } from 'react-bootstrap'
import { usePathname } from 'next/navigation'

const LABELS: Record<string, string> = {
  users: 'Users',
  guides: 'Hosts / Curators',
  experiences: 'Experiences',
  bookings: 'Bookings',
  payments: 'Payments & Payouts',
  settings: 'Settings',
  team: 'Admin Management',
}

export default function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const section = segments[0]
  const label = LABELS[section] ?? 'Dashboard'

  return (
    <BSBreadcrumb listProps={{ className: 'mb-0 align-items-center' }}>
      <BreadcrumbItem linkProps={{ className: 'text-decoration-none' }} href="/">
        Home
      </BreadcrumbItem>
      {section && (
        <BreadcrumbItem active>{label}</BreadcrumbItem>
      )}
    </BSBreadcrumb>
  )
}
