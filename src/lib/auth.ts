import Cookies from 'js-cookie'
import api, { TOKEN_COOKIE } from '@/lib/api'
import type { Admin, AdminRole, LoginResponse } from '@/types'

const ROLE_COOKIE = 'helm_role'

export async function login(email: string, password: string): Promise<{ admin: Admin; role: AdminRole }> {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)

  const { data } = await api.post<LoginResponse>('/admin/login', form.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  Cookies.set(TOKEN_COOKIE, data.access_token, { expires: 7, sameSite: 'strict' })
  Cookies.set(ROLE_COOKIE, data.role, { expires: 7, sameSite: 'strict' })

  const { data: admin } = await api.get<Admin>('/admin/me')

  return { admin, role: data.role }
}

export function logout() {
  Cookies.remove(TOKEN_COOKIE)
  Cookies.remove(ROLE_COOKIE)
}

export function getTokenFromCookie(): string | undefined {
  return Cookies.get(TOKEN_COOKIE)
}

export function getRoleFromCookie(): AdminRole | undefined {
  return Cookies.get(ROLE_COOKIE) as AdminRole | undefined
}
