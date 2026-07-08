'use client'

import { useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'
import { useAuthStore } from '@/store/auth.store'

export default function HeaderLogout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const clear = useAuthStore((s) => s.clear)

  const handleLogout = () => {
    logout()
    clear()
    router.push('/login')
  }

  return (
    <div onClick={handleLogout} onKeyDown={handleLogout} role="button" tabIndex={0}>
      {children}
    </div>
  )
}
