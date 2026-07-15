import {
  faGauge, faUsers, faMapMarkerAlt, faCalendarCheck,
  faCreditCard, faGear, faUserShield,
} from '@fortawesome/free-solid-svg-icons'
import { faCompass } from '@fortawesome/free-regular-svg-icons'
import { cookies } from 'next/headers'
import SidebarNavItem from '@/components/Layout/Dashboard/Sidebar/SidebarNavItem'

export default async function SidebarNav() {
  const role = (await cookies()).get('helm_role')?.value
  const isSuperAdmin = role === 'superadmin'

  return (
    <ul className="list-unstyled">
      <li className="nav-title px-3 py-2 mt-3 text-uppercase fw-bold small">Main</li>

      <SidebarNavItem icon={faGauge} href="/">
        Dashboard
      </SidebarNavItem>

      <li className="nav-title px-3 py-2 mt-3 text-uppercase fw-bold small">People</li>

      <SidebarNavItem icon={faUsers} href="/users">
        Users
      </SidebarNavItem>

      <SidebarNavItem icon={faCompass} href="/guides">
        Hosts / Curators
      </SidebarNavItem>

      <li className="nav-title px-3 py-2 mt-3 text-uppercase fw-bold small">Operations</li>

      <SidebarNavItem icon={faMapMarkerAlt} href="/experiences">
        Experiences
      </SidebarNavItem>

      <SidebarNavItem icon={faCalendarCheck} href="/bookings">
        Bookings
      </SidebarNavItem>

      <SidebarNavItem icon={faCreditCard} href="/payments">
        Payments & Payouts
      </SidebarNavItem>

      <li className="nav-title px-3 py-2 mt-3 text-uppercase fw-bold small">Admin Tools</li>

      <SidebarNavItem icon={faCompass} href="/admin/social-media-import">
        Social Imports
      </SidebarNavItem>

      <SidebarNavItem icon={faMapMarkerAlt} href="/admin/temporary-experiences">
        Temporary Experiences
      </SidebarNavItem>

      <li className="nav-title px-3 py-2 mt-3 text-uppercase fw-bold small">System</li>

      <SidebarNavItem icon={faGear} href="/settings">
        Settings
      </SidebarNavItem>

      {isSuperAdmin && (
        <SidebarNavItem icon={faUserShield} href="/team">
          Admin Management
        </SidebarNavItem>
      )}
    </ul>
  )
}
