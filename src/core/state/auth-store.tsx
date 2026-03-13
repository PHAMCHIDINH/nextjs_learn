'use client'

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { queryKeys } from '@/core/query/keys'
import type { User } from '@/lib/types'
import { authApi } from '@/modules/auth/services/auth.api'

type SessionInput = {
  user: User
}

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest'

export type AuthStoreState = {
  user: User | null
  status: AuthStatus
  bootstrap: () => Promise<User | null>
  setSession: (payload: SessionInput) => void
  refreshMe: () => Promise<User | null>
  logout: () => Promise<void>
  clear: () => void
}

type AuthStoreApi = ReturnType<typeof createAuthStore>

const AuthStoreContext = createContext<AuthStoreApi | null>(null)

const clearUserQueries = async (queryClient: QueryClient) => {
  await Promise.all([
    queryClient.removeQueries({ queryKey: queryKeys.notifications.all }),
    queryClient.removeQueries({ queryKey: queryKeys.dashboard.all }),
    queryClient.removeQueries({ queryKey: queryKeys.users.all }),
    queryClient.removeQueries({ queryKey: queryKeys.conversations.all }),
    queryClient.removeQueries({ queryKey: queryKeys.admin.all }),
  ])
}

const createAuthStore = (queryClient: QueryClient) => {
  let bootstrapPromise: Promise<User | null> | null = null

  return createStore<AuthStoreState>((set, get) => ({
    user: null,
    status: 'idle',
    bootstrap: async () => {
      const { status, user } = get()
      if (status === 'authenticated' || status === 'guest') {
        return user
      }

      if (bootstrapPromise) {
        return bootstrapPromise
      }

      set({ status: 'loading' })
      bootstrapPromise = authApi
        .me()
        .then((me) => {
          queryClient.setQueryData(queryKeys.auth.me(), me)
          set({ user: me, status: 'authenticated' })
          return me
        })
        .catch(() => {
          queryClient.setQueryData(queryKeys.auth.me(), null)
          set({ user: null, status: 'guest' })
          return null
        })
        .finally(() => {
          bootstrapPromise = null
        })

      return bootstrapPromise
    },
    setSession: (payload) => {
      queryClient.setQueryData(queryKeys.auth.me(), payload.user)
      set({
        user: payload.user,
        status: 'authenticated',
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
    refreshMe: async () => {
      try {
        const me = await authApi.me()
        queryClient.setQueryData(queryKeys.auth.me(), me)
        set({ user: me, status: 'authenticated' })
        return me
      } catch {
        queryClient.setQueryData(queryKeys.auth.me(), null)
        set({ user: null, status: 'guest' })
        return null
      }
    },
    logout: async () => {
      try {
        await authApi.logout()
      } catch {
        // Ignore network/logout errors and clear local state.
      } finally {
        get().clear()
        await clearUserQueries(queryClient)
      }
    },
    clear: () => {
      queryClient.setQueryData(queryKeys.auth.me(), null)
      set({
        user: null,
        status: 'guest',
      })
    },
  }))
}

export function AuthStoreProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [store] = useState(() => createAuthStore(queryClient))

  return (
    <AuthStoreContext.Provider value={store}>
      {children}
    </AuthStoreContext.Provider>
  )
}

export const useAuthStore = <T,>(selector: (state: AuthStoreState) => T): T => {
  const store = useContext(AuthStoreContext)
  if (!store) {
    throw new Error('useAuthStore must be used within AuthStoreProvider')
  }

  return useStore(store, selector)
}

export const useAuthStoreApi = () => {
  const store = useContext(AuthStoreContext)
  if (!store) {
    throw new Error('useAuthStoreApi must be used within AuthStoreProvider')
  }

  return store
}
