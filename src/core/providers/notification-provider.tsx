'use client'

import {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { io, type Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { getApiBaseUrl } from '@/lib/api'
import type { Notification } from '@/lib/types'
import { useAuth } from '@/core/providers/auth-provider'
import {
  normalizeNotification,
  NotificationStoreProvider,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/core/state/notification-store'
import { authApi } from '@/modules/auth/services/auth.api'

type NotificationContextValue = {
  unreadCount: number
  chatUnreadCount: number
  notifications: Notification[]
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

function NotificationContextBridge({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id
  const socketRef = useRef<Socket | null>(null)
  const notificationStore = useNotificationStoreApi()
  const notifications = useNotificationStore((state) => state.notifications)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const refreshStore = useNotificationStore((state) => state.refresh)
  const markReadStore = useNotificationStore((state) => state.markRead)
  const markAllReadStore = useNotificationStore((state) => state.markAllRead)

  const refresh = useCallback(async () => {
    try {
      await refreshStore(userId)
    } catch {
      toast.error('Không tải được thông báo')
    }
  }, [refreshStore, userId])

  const markRead = useCallback(
    async (id: string) => {
      await markReadStore(id, userId)
    },
    [markReadStore, userId],
  )

  const markAllRead = useCallback(async () => {
    await markAllReadStore(userId)
  }, [markAllReadStore, userId])

  useEffect(() => {
    if (!userId) {
      socketRef.current?.removeAllListeners()
      socketRef.current?.disconnect()
      socketRef.current = null
      notificationStore.getState().clear()
      return
    }

    void notificationStore.getState().bootstrap(userId).catch(() => {})

    const socket = io(`${getApiBaseUrl()}/notifications`, {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      auth: (cb) => {
        void authApi
          .createSocketToken()
          .then(({ token }) => cb({ token }))
          .catch(() => cb({}))
      },
    })

    socketRef.current = socket

    socket.on('connect', () => {
      notificationStore.getState().setSocketConnected(true)
    })

    socket.on('disconnect', () => {
      notificationStore.getState().setSocketConnected(false)
    })

    socket.on('connect_error', () => {
      notificationStore.getState().setSocketConnected(false)
    })

    socket.on('notification:new', (rawPayload: unknown) => {
      const incoming = normalizeNotification(rawPayload)
      if (!incoming) {
        return
      }

      notificationStore.getState().pushIncoming(incoming)

      toast(incoming.title || 'Thong bao moi', {
        description: incoming.body,
      })
    })

    socket.connect()

    return () => {
      notificationStore.getState().setSocketConnected(false)
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [notificationStore, userId])

  const chatUnreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead && item.type === 'NEW_MESSAGE').length,
    [notifications],
  )

  const value = useMemo<NotificationContextValue>(
    () => ({
      unreadCount,
      chatUnreadCount,
      notifications,
      markRead,
      markAllRead,
      refresh,
    }),
    [chatUnreadCount, markAllRead, markRead, notifications, refresh, unreadCount],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  return (
    <NotificationStoreProvider>
      <NotificationContextBridge>{children}</NotificationContextBridge>
    </NotificationStoreProvider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }

  return context
}
