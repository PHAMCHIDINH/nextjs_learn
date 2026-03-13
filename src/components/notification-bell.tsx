'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Bell, CheckCheck, MessageSquare, ShieldCheck, ShieldX, Star } from 'lucide-react'
import type { Notification } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useNotification } from '@/core/providers/notification-provider'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getMetadataString = (metadata: unknown, key: string): string | null => {
  if (!isRecord(metadata)) {
    return null
  }

  const value = metadata[key]
  return typeof value === 'string' && value.trim() ? value : null
}

const getNotificationHref = (notification: Notification): string | null => {
  if (notification.type === 'NEW_MESSAGE') {
    const conversationId = getMetadataString(notification.metadata, 'conversationId')
    return conversationId ? `/chat?conversationId=${encodeURIComponent(conversationId)}` : '/chat'
  }

  if (
    notification.type === 'LISTING_APPROVED' ||
    notification.type === 'LISTING_REJECTED' ||
    notification.type === 'NEW_REVIEW'
  ) {
    const listingId = getMetadataString(notification.metadata, 'listingId')
    return listingId ? `/product/${encodeURIComponent(listingId)}` : '/dashboard'
  }

  return '/dashboard'
}

const notificationIcon = (notification: Notification) => {
  switch (notification.type) {
    case 'NEW_MESSAGE':
      return <MessageSquare className="h-4 w-4 text-primary" />
    case 'LISTING_APPROVED':
      return <ShieldCheck className="h-4 w-4 text-emerald-600" />
    case 'LISTING_REJECTED':
      return <ShieldX className="h-4 w-4 text-destructive" />
    case 'NEW_REVIEW':
      return <Star className="h-4 w-4 text-amber-500" />
    default:
      return <Bell className="h-4 w-4 text-primary" />
  }
}

export function NotificationBell() {
  const router = useRouter()
  const { unreadCount, notifications, markRead, markAllRead } = useNotification()

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      ),
    [notifications],
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Thong bao</DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => void markAllRead()}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Danh dau da doc
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />
        {sortedNotifications.length > 0 ? (
          <div className="max-h-80 overflow-y-auto p-1">
            {sortedNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'cursor-pointer items-start gap-3 p-3',
                  !notification.isRead && 'bg-primary/5',
                )}
                onClick={() => {
                  void markRead(notification.id)
                  const href = getNotificationHref(notification)
                  if (href) {
                    router.push(href)
                  }
                }}
              >
                <div className="mt-0.5">{notificationIcon(notification)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">{notification.title}</p>
                    {!notification.isRead ? (
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(notification.createdAt, {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">Chua co thong bao</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
