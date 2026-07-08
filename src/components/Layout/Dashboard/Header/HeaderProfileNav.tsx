'use client'

import {
  Dropdown,
  DropdownDivider,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Nav,
  NavItem,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faPowerOff } from '@fortawesome/free-solid-svg-icons'
import { PropsWithChildren } from 'react'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import HeaderLogout from '@/components/Layout/Dashboard/Header/HeaderLogout'
import { useAuthStore } from '@/store/auth.store'

const ItemWithIcon = ({ icon, children }: { icon: IconDefinition } & PropsWithChildren) => (
  <>
    <FontAwesomeIcon className="me-2" icon={icon} fixedWidth />
    {children}
  </>
)

export default function HeaderProfileNav() {
  const admin = useAuthStore((s) => s.admin)
  const role = useAuthStore((s) => s.role)

  const displayName = admin?.full_name ?? admin?.email ?? 'Admin'

  return (
    <Nav>
      <Dropdown as={NavItem}>
        <DropdownToggle
          variant="link"
          bsPrefix="hide-caret"
          className="py-0 px-2 rounded-0"
          id="dropdown-profile"
        >
          <div
            className="avatar position-relative d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
            style={{ width: 32, height: 32, fontSize: 14 }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        </DropdownToggle>
        <DropdownMenu className="pt-0" align="end">
          <div className="px-3 py-2 border-bottom">
            <div className="fw-semibold small">{displayName}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>
              {role === 'superadmin' ? 'Superadmin' : 'Admin'}
            </div>
          </div>

          <DropdownItem href="/settings">
            <ItemWithIcon icon={faGear}>Settings</ItemWithIcon>
          </DropdownItem>

          <DropdownDivider />

          <HeaderLogout>
            <DropdownItem className="text-danger">
              <ItemWithIcon icon={faPowerOff}>Logout</ItemWithIcon>
            </DropdownItem>
          </HeaderLogout>
        </DropdownMenu>
      </Dropdown>
    </Nav>
  )
}
