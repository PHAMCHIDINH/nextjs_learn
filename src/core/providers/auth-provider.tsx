'use client'

import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import type { User } from '@/lib/types'
import {
  AuthStoreProvider,
  useAuthStore,
  useAuthStoreApi,
} from '@/core/state/auth-store'

type SessionInput = {
  user: User
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  setSession: (payload: SessionInput) => void
  refreshMe: () => Promise<User | null>
  logout: () => Promise<void>
}

function AuthContextBridge({ children }: { children: ReactNode }) {
  const authStore = useAuthStoreApi()
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const setSession = useAuthStore((state) => state.setSession)
  const refreshMe = useAuthStore((state) => state.refreshMe)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    void authStore.getState().bootstrap()
  }, [authStore])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: status === 'idle' || status === 'loading',
      setSession,
      refreshMe,
      logout,
    }),
    [logout, refreshMe, setSession, status, user],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthStoreProvider>
      <AuthContextBridge>{children}</AuthContextBridge>
    </AuthStoreProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
