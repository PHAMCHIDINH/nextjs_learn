'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@/lib/types'
import { authApi, clearAccessToken, setAccessToken } from '@/lib/api'

type SessionInput = {
  accessToken: string
  user: User
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  setSession: (payload: SessionInput) => void
  refreshMe: () => Promise<User | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    try {
      const me = await authApi.me()
      setUser(me)
      return me
    } catch {
      setUser(null)
      clearAccessToken()
      return null
    }
  }, [])

  const setSession = useCallback((payload: SessionInput) => {
    setAccessToken(payload.accessToken)
    setUser(payload.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore network/logout errors and clear local state
    } finally {
      clearAccessToken()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const run = async () => {
      await refreshMe()
      setLoading(false)
    }
    run()
  }, [refreshMe])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      setSession,
      refreshMe,
      logout,
    }),
    [loading, refreshMe, setSession, user, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
