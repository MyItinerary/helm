'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Admin, AdminRole } from '@/types'

interface AuthState {
  admin: Admin | null
  role: AdminRole | null
  setAuth: (admin: Admin, role: AdminRole) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      role: null,
      setAuth: (admin, role) => set({ admin, role }),
      clear: () => set({ admin: null, role: null }),
    }),
    {
      name: 'helm-auth',
      partialize: (state) => ({ admin: state.admin, role: state.role }),
    },
  ),
)
