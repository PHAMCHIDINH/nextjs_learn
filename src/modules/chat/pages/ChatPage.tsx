'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { io, type Socket } from 'socket.io-client'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  ImagePlus,
  Loader2,
  MessageSquare,
  MoreVertical,
  Search,
  Send,
  ShoppingBag,
  X,
} from 'lucide-react'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { conversationsApi, getAccessToken, uploadsApi } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import type { Conversation, Message } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { Input } from '@/shared/ui/input'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { cn } from '@/lib/utils'

const SOCKET_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
const FALLBACK_POLL_MS = 6000
const MESSAGE_ACK_TIMEOUT_MS = 10000
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

type DeliveryStatus = 'sending' | 'sent' | 'failed'

type UiMessage = Message & {
  clientTempId?: string
  deliveryStatus?: DeliveryStatus
}

type ChatMessageEnvelope = {
  conversationId?: unknown
  message?: unknown
  clientTempId?: unknown
}

type ChatErrorEnvelope = {
  code?: unknown
  message?: unknown
  conversationId?: unknown
  clientTempId?: unknown
}

type ConversationListPanelProps = {
  conversations: Conversation[]
  currentUserId?: string
  selectedConversationId: string | null
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onSelectConversation: (conversationId: string) => void
}

type ChatAreaPanelProps = {
  selectedConversation: Conversation | null
  currentUserId?: string
  messages: UiMessage[]
  draftText: string
  hasPendingImage: boolean
  pendingImagePreview: string | null
  isSending: boolean
  isUploadingImage: boolean
  onDraftTextChange: (value: string) => void
  onSendMessage: () => void
  onPickImage: () => void
  onRemovePendingImage: () => void
  onBackMobile: () => void
  messagesEndRef: RefObject<HTMLDivElement | null>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return new Date()
}

const normalizeMessage = (value: unknown): Message | null => {
  if (!isRecord(value)) {
    return null
  }

  const id = typeof value.id === 'string' ? value.id : ''
  const senderId = typeof value.senderId === 'string' ? value.senderId : ''
  const receiverId = typeof value.receiverId === 'string' ? value.receiverId : ''
  if (!id || !senderId || !receiverId) {
    return null
  }

  const type: Message['type'] = value.type === 'image' ? 'image' : 'text'

  return {
    id,
    senderId,
    receiverId,
    content: typeof value.content === 'string' ? value.content : '',
    type,
    imageUrl: typeof value.imageUrl === 'string' ? value.imageUrl : undefined,
    createdAt: toDate(value.createdAt),
    read: typeof value.read === 'boolean' ? value.read : false,
    productId: typeof value.productId === 'string' ? value.productId : undefined,
  }
}

const mergeServerAndPendingMessages = (
  serverMessages: UiMessage[],
  previousMessages: UiMessage[],
): UiMessage[] => {
  const pendingMessages = previousMessages.filter(
    (message) => message.deliveryStatus === 'sending' || message.deliveryStatus === 'failed',
  )
  const serverIds = new Set(serverMessages.map((message) => message.id))
  const keptPending = pendingMessages.filter((message) => !serverIds.has(message.id))

  return [...serverMessages, ...keptPending].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
  )
}

const formatMessageTime = (date: Date) => {
  if (isToday(date)) {
    return format(date, 'HH:mm')
  }

  if (isYesterday(date)) {
    return `Hom qua ${format(date, 'HH:mm')}`
  }

  return format(date, 'dd/MM HH:mm')
}

function ConversationListPanel({
  conversations,
  currentUserId,
  selectedConversationId,
  searchQuery,
  onSearchQueryChange,
  onSelectConversation,
}: ConversationListPanelProps) {
  const filteredConversations = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) {
      return conversations
    }

    return conversations.filter((conversation) => {
      const otherParticipant = conversation.participants.find(
        (participant) => participant.id !== currentUserId,
      )

      return (
        otherParticipant?.name.toLowerCase().includes(keyword) ||
        conversation.product?.title.toLowerCase().includes(keyword)
      )
    })
  }, [conversations, currentUserId, searchQuery])

  return (
    <div className="flex h-full flex-col border-r border-border/70 bg-white/85">
      <div className="border-b border-border/70 p-4">
        <div className="mb-4 rounded-3xl border border-border/70 bg-zinc-950 px-4 py-4 text-white">
          <p className="text-sm uppercase tracking-[0.18em] text-zinc-400">Hoi thoai</p>
          <h2 className="mt-2 text-xl font-semibold">Chat theo tung san pham</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Theo doi nguoi ban, san pham va thoi diem phan hoi trong cung mot noi.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tim kiem hoi thoai..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="h-11 rounded-full pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredConversations.length > 0 ? (
          <div className="space-y-2 p-3">
            {filteredConversations.map((conversation) => {
              const otherParticipant = conversation.participants.find(
                (participant) => participant.id !== currentUserId,
              )
              const isSelected = selectedConversationId === conversation.id

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border border-transparent p-3 text-left transition-all',
                    isSelected ? 'border-primary/20 bg-primary/5 shadow-sm' : 'hover:bg-muted/50',
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                      <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.name} />
                      <AvatarFallback>{otherParticipant?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {otherParticipant?.online ? (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-medium">{otherParticipant?.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(conversation.updatedAt, {
                          addSuffix: false,
                          locale: vi,
                        })}
                      </span>
                    </div>
                    {conversation.product ? (
                      <div className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] text-primary">
                        <ShoppingBag className="h-3 w-3" />
                        <span className="truncate">{conversation.product.title}</span>
                      </div>
                    ) : null}
                    <p className="mt-2 truncate text-sm text-muted-foreground">
                      {conversation.lastMessage?.senderId === currentUserId ? 'Ban: ' : ''}
                      {conversation.lastMessage?.content || 'Chua co tin nhan'}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 ? (
                    <Badge className="h-5 w-5 shrink-0 rounded-full p-0 text-xs">
                      {conversation.unreadCount}
                    </Badge>
                  ) : null}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Search className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Khong tim thay hoi thoai</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function ChatAreaPanel({
  selectedConversation,
  currentUserId,
  messages,
  draftText,
  hasPendingImage,
  pendingImagePreview,
  isSending,
  isUploadingImage,
  onDraftTextChange,
  onSendMessage,
  onPickImage,
  onRemovePendingImage,
  onBackMobile,
  messagesEndRef,
}: ChatAreaPanelProps) {
  if (!selectedConversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[linear-gradient(180deg,_rgba(244,244,245,0.9)_0%,_rgba(255,255,255,0.96)_100%)] p-8 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">Chon mot cuoc tro chuyen</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Chon mot hoi thoai ben trai de bat dau nhan tin voi nguoi ban hoac nguoi mua.
        </p>
      </div>
    )
  }

  const otherParticipant = selectedConversation.participants.find(
    (participant) => participant.id !== currentUserId,
  )

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,_rgba(244,244,245,0.7)_0%,_rgba(255,255,255,0.96)_100%)]">
      <div className="flex items-center justify-between border-b border-border/70 bg-white/90 p-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full lg:hidden" onClick={onBackMobile}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative">
            <Avatar className="h-11 w-11 ring-2 ring-primary/10">
              <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.name} />
              <AvatarFallback>{otherParticipant?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {otherParticipant?.online ? (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{otherParticipant?.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {otherParticipant?.online
                ? 'Dang hoat dong'
                : `Hoat dong ${formatDistanceToNow(otherParticipant?.lastSeen || new Date(), {
                    addSuffix: true,
                    locale: vi,
                  })}`}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Xem ho so</DropdownMenuItem>
            <DropdownMenuItem>Tat thong bao</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Chan nguoi dung</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedConversation.product ? (
        <Link
          href={`/product/${selectedConversation.product.id}`}
          className="border-b border-border/70 bg-white/70 p-3 transition-colors hover:bg-white"
        >
          <Card className="border-border/70 bg-white/90 shadow-sm">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl">
                <Image
                  src={selectedConversation.product.images[0]}
                  alt={selectedConversation.product.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{selectedConversation.product.title}</p>
                <p className="text-sm font-semibold text-primary">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    maximumFractionDigits: 0,
                  }).format(selectedConversation.product.price)}
                </p>
              </div>
              <Badge variant="outline">Xem san pham</Badge>
            </CardContent>
          </Card>
        </Link>
      ) : null}

      <ScrollArea className="flex-1 px-4 py-5">
        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((message) => {
              const isMe = message.senderId === currentUserId
              const sender = selectedConversation.participants.find(
                (participant) => participant.id === message.senderId,
              )

              return (
                <div key={message.id} className={cn('flex items-end gap-2', isMe && 'flex-row-reverse')}>
                  {!isMe ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={sender?.avatar} alt={sender?.name} />
                      <AvatarFallback>{sender?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ) : null}
                  <div className={cn('max-w-[78%]', isMe && 'items-end')}>
                    <div
                      className={cn(
                        'rounded-3xl px-4 py-3 shadow-sm',
                        isMe
                          ? 'rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-bl-md bg-white text-foreground',
                      )}
                    >
                      {message.type === 'image' && message.imageUrl ? (
                        <div className={cn('overflow-hidden rounded-2xl', message.content ? 'mb-2' : '')}>
                          <Image
                            src={message.imageUrl}
                            alt="Shared image"
                            width={220}
                            height={220}
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                      {message.content ? <p className="text-sm leading-7">{message.content}</p> : null}
                    </div>
                    <div className={cn('mt-1 flex items-center gap-1 text-xs text-muted-foreground', isMe && 'justify-end')}>
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {isMe ? (
                        message.deliveryStatus === 'sending' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : message.deliveryStatus === 'failed' ? (
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        ) : message.read ? (
                          <CheckCheck className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">Bat dau cuoc tro chuyen voi {otherParticipant?.name}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border/70 bg-white/90 p-4">
        {pendingImagePreview ? (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-background p-2">
            <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-border">
              <Image src={pendingImagePreview} alt="Pending upload" fill className="object-cover" />
            </div>
            <div className="flex-1 text-sm text-muted-foreground">1 image selected</div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onRemovePendingImage}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-2 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onPickImage}
            disabled={isSending || isUploadingImage}
          >
            {isUploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          </Button>
          <Input
            placeholder="Nhap tin nhan..."
            value={draftText}
            onChange={(event) => onDraftTextChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                onSendMessage()
              }
            }}
            className="border-none bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            size="icon"
            className="rounded-full"
            onClick={onSendMessage}
            disabled={(!draftText.trim() && !hasPendingImage) || isSending || isUploadingImage}
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ChatContent() {
  const searchParams = useSearchParams()
  const presetConversationId = searchParams.get('conversation')
  const productId = searchParams.get('product')
  const sellerId = searchParams.get('seller')

  const { user } = useAuth()
  const currentUserId = user?.id

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [draftText, setDraftText] = useState('')
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const selectedConversationIdRef = useRef<string | null>(null)
  const currentUserIdRef = useRef<string | undefined>(undefined)
  const pendingTimeoutsRef = useRef<Map<string, number>>(new Map())

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  )

  const clearPendingTimeout = useCallback((clientTempId: string) => {
    const timeoutId = pendingTimeoutsRef.current.get(clientTempId)
    if (timeoutId) {
      window.clearTimeout(timeoutId)
      pendingTimeoutsRef.current.delete(clientTempId)
    }
  }, [])

  const clearPendingImage = useCallback(() => {
    setPendingImageFile(null)
    setPendingImagePreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous)
      }
      return null
    })
  }, [])

  const markMessageFailed = useCallback(
    (clientTempId: string, message: string) => {
      clearPendingTimeout(clientTempId)
      setMessages((previous) =>
        previous.map((item) =>
          item.clientTempId === clientTempId ? { ...item, deliveryStatus: 'failed' } : item,
        ),
      )
      toast.error(message)
    },
    [clearPendingTimeout],
  )

  const syncConversations = useCallback(
    async ({
      withLoading = false,
      silentError = false,
      preferPreset = false,
    }: {
      withLoading?: boolean
      silentError?: boolean
      preferPreset?: boolean
    } = {}) => {
      if (!currentUserId) {
        if (withLoading) {
          setLoading(false)
        }
        return []
      }

      if (withLoading) {
        setLoading(true)
      }

      try {
        const data = await conversationsApi.list()
        setConversations(data)

        if (!data.length) {
          setSelectedConversationId(null)
          setMessages([])
          return data
        }

        let nextSelectedConversationId = selectedConversationIdRef.current
        if (preferPreset && presetConversationId && data.some((item) => item.id === presetConversationId)) {
          nextSelectedConversationId = presetConversationId
        }

        if (!nextSelectedConversationId || !data.some((item) => item.id === nextSelectedConversationId)) {
          nextSelectedConversationId = data[0].id
        }

        if (nextSelectedConversationId !== selectedConversationIdRef.current) {
          setSelectedConversationId(nextSelectedConversationId)
        }

        if (preferPreset && presetConversationId && nextSelectedConversationId === presetConversationId) {
          setShowMobileChat(true)
        }

        return data
      } catch {
        if (!silentError) {
          toast.error('Khong tai duoc danh sach hoi thoai')
        }
        return []
      } finally {
        if (withLoading) {
          setLoading(false)
        }
      }
    },
    [currentUserId, presetConversationId],
  )

  const syncMessages = useCallback(
    async (conversationId: string, { silentError = false }: { silentError?: boolean } = {}) => {
      if (!currentUserId) {
        return
      }

      try {
        const result = await conversationsApi.messages(conversationId, {
          page: 1,
          limit: 100,
        })
        const normalized = result.data.map((message) => ({
          ...message,
          deliveryStatus: 'sent' as DeliveryStatus,
        }))

        setMessages((previous) => mergeServerAndPendingMessages(normalized, previous))

        const hasUnreadIncoming = result.data.some(
          (message) => message.senderId !== currentUserId && !message.read,
        )
        if (hasUnreadIncoming) {
          await conversationsApi.markRead(conversationId)
        }
      } catch {
        if (!silentError) {
          toast.error('Khong tai duoc tin nhan')
        }
      }
    },
    [currentUserId],
  )

  const syncConversationsRef = useRef(syncConversations)
  const syncMessagesRef = useRef(syncMessages)

  useEffect(() => {
    syncConversationsRef.current = syncConversations
  }, [syncConversations])

  useEffect(() => {
    syncMessagesRef.current = syncMessages
  }, [syncMessages])

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId
  }, [selectedConversationId])

  useEffect(() => {
    currentUserIdRef.current = currentUserId
  }, [currentUserId])

  useEffect(() => {
    void syncConversations({ withLoading: true, preferPreset: true })
  }, [currentUserId, syncConversations])

  useEffect(() => {
    const run = async () => {
      if (!productId || !sellerId || !currentUserId) {
        return
      }

      try {
        const conversation = await conversationsApi.create({
          participantId: sellerId,
          productId,
        })
        const data = await syncConversations({ silentError: true })
        const nextConversation = data.find((item) => item.id === conversation.id) ?? conversation
        setSelectedConversationId(nextConversation.id)
        setShowMobileChat(true)
        await syncMessages(nextConversation.id, { silentError: true })
      } catch {
        toast.error('Khong tao duoc hoi thoai')
      }
    }

    void run()
  }, [currentUserId, productId, sellerId, syncConversations, syncMessages])

  useEffect(() => {
    if (!selectedConversationId || !currentUserId) {
      setMessages([])
      return
    }

    void syncMessages(selectedConversationId)
  }, [currentUserId, selectedConversationId, syncMessages])

  useEffect(() => {
    if (!currentUserId) {
      return
    }

    const token = getAccessToken()
    if (!token) {
      setIsSocketConnected(false)
      return
    }

    const socket = io(`${SOCKET_BASE_URL}/chat`, {
      transports: ['websocket'],
      withCredentials: true,
      auth: {
        token,
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsSocketConnected(true)
    })

    socket.on('disconnect', () => {
      setIsSocketConnected(false)
    })

    socket.on('connect_error', () => {
      setIsSocketConnected(false)
    })

    socket.on('chat:message', (rawEnvelope: ChatMessageEnvelope) => {
      if (!isRecord(rawEnvelope)) {
        return
      }

      const conversationId =
        typeof rawEnvelope.conversationId === 'string' ? rawEnvelope.conversationId : null
      const clientTempId =
        typeof rawEnvelope.clientTempId === 'string' ? rawEnvelope.clientTempId : undefined
      const incomingMessage = normalizeMessage(rawEnvelope.message)

      if (!conversationId || !incomingMessage) {
        return
      }

      if (clientTempId) {
        clearPendingTimeout(clientTempId)
      }

      if (selectedConversationIdRef.current !== conversationId) {
        void syncConversationsRef.current({ silentError: true })
        return
      }

      setMessages((previous) => {
        if (clientTempId) {
          const optimisticIndex = previous.findIndex(
            (item) => item.clientTempId === clientTempId,
          )
          if (optimisticIndex >= 0) {
            const next = [...previous]
            next[optimisticIndex] = {
              ...incomingMessage,
              clientTempId,
              deliveryStatus: 'sent',
            }
            return next
          }
        }

        if (previous.some((item) => item.id === incomingMessage.id)) {
          return previous
        }

        return [...previous, { ...incomingMessage, deliveryStatus: 'sent' }]
      })

      if (incomingMessage.senderId !== currentUserIdRef.current) {
        void conversationsApi.markRead(conversationId)
      }

      void syncConversationsRef.current({ silentError: true })
    })

    socket.on('chat:error', (rawError: ChatErrorEnvelope) => {
      if (!isRecord(rawError)) {
        toast.error('Gui tin nhan that bai')
        return
      }

      const message =
        typeof rawError.message === 'string' && rawError.message.trim()
          ? rawError.message
          : 'Gui tin nhan that bai'
      const clientTempId =
        typeof rawError.clientTempId === 'string' ? rawError.clientTempId : null

      if (clientTempId) {
        markMessageFailed(clientTempId, message)
        return
      }

      toast.error(message)
    })

    return () => {
      setIsSocketConnected(false)
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [clearPendingTimeout, currentUserId, markMessageFailed])

  useEffect(() => {
    if (!currentUserId || isSocketConnected) {
      return
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return
      }

      void syncConversationsRef.current({ silentError: true })
      if (selectedConversationIdRef.current) {
        void syncMessagesRef.current(selectedConversationIdRef.current, {
          silentError: true,
        })
      }
    }, FALLBACK_POLL_MS)

    return () => window.clearInterval(interval)
  }, [currentUserId, isSocketConnected])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedConversationId])

  useEffect(() => {
    const pendingTimeouts = pendingTimeoutsRef.current

    return () => {
      clearPendingImage()
      pendingTimeouts.forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
      pendingTimeouts.clear()
    }
  }, [clearPendingImage])

  const handleImageSelection = useCallback((file?: File) => {
    if (!file) {
      return
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast.error('Chi chap nhan JPG, PNG, WEBP')
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Moi anh toi da 5MB')
      return
    }

    setPendingImageFile(file)
    setPendingImagePreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous)
      }
      return URL.createObjectURL(file)
    })
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!selectedConversation || !currentUserId) {
      return
    }

    const content = draftText.trim()
    if (!content && !pendingImageFile) {
      return
    }

    if (isSending || isUploadingImage) {
      return
    }

    setIsSending(true)

    try {
      let imageUrl: string | undefined
      if (pendingImageFile) {
        setIsUploadingImage(true)
        try {
          const uploadResult = await uploadsApi.uploadImages([pendingImageFile])
          imageUrl = uploadResult.data[0]?.url
          if (!imageUrl) {
            throw new Error('Image upload returned empty URL')
          }
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Khong tai anh len duoc')
          return
        } finally {
          setIsUploadingImage(false)
        }
      }

      const clientTempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const optimisticMessage: UiMessage = {
        id: clientTempId,
        senderId: currentUserId,
        receiverId:
          selectedConversation.participants.find((participant) => participant.id !== currentUserId)?.id ??
          currentUserId,
        content,
        type: imageUrl ? 'image' : 'text',
        imageUrl,
        createdAt: new Date(),
        read: true,
        productId: selectedConversation.product?.id,
        clientTempId,
        deliveryStatus: 'sending',
      }

      setMessages((previous) => [...previous, optimisticMessage])
      setDraftText('')
      clearPendingImage()

      const payload = {
        content: content || undefined,
        imageUrl,
        type: imageUrl ? ('image' as const) : ('text' as const),
      }

      const socket = socketRef.current
      if (socket && socket.connected) {
        socket.emit('chat:send', {
          conversationId: selectedConversation.id,
          clientTempId,
          ...payload,
        })

        const timeoutId = window.setTimeout(() => {
          markMessageFailed(clientTempId, 'Khong nhan duoc xac nhan tu server')
        }, MESSAGE_ACK_TIMEOUT_MS)
        pendingTimeoutsRef.current.set(clientTempId, timeoutId)
      } else {
        try {
          const sentMessage = await conversationsApi.sendMessage(selectedConversation.id, payload)
          setMessages((previous) =>
            previous.map((message) =>
              message.clientTempId === clientTempId
                ? { ...sentMessage, clientTempId, deliveryStatus: 'sent' }
                : message,
            ),
          )
        } catch (error) {
          markMessageFailed(
            clientTempId,
            error instanceof Error ? error.message : 'Khong gui duoc tin nhan',
          )
        }
      }

      void syncConversationsRef.current({ silentError: true })
    } finally {
      setIsSending(false)
    }
  }, [
    clearPendingImage,
    currentUserId,
    draftText,
    isSending,
    isUploadingImage,
    markMessageFailed,
    pendingImageFile,
    selectedConversation,
  ])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[linear-gradient(180deg,_rgba(250,250,249,1)_0%,_rgba(244,244,245,1)_100%)]">
      <Header />

      <main className="flex flex-1 overflow-hidden px-4 py-4 md:px-5">
        <div className="mx-auto flex h-full w-full max-w-7xl overflow-hidden rounded-[2rem] border border-border/70 bg-white/80 shadow-xl shadow-zinc-950/5 backdrop-blur">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              handleImageSelection(file)
              event.target.value = ''
            }}
          />

          <div className="hidden h-full w-96 flex-shrink-0 lg:block">
            <ConversationListPanel
              conversations={conversations}
              currentUserId={currentUserId}
              selectedConversationId={selectedConversationId}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSelectConversation={(conversationId) => {
                setSelectedConversationId(conversationId)
                setShowMobileChat(true)
              }}
            />
          </div>
          <div className="hidden flex-1 lg:block">
            <ChatAreaPanel
              selectedConversation={selectedConversation}
              currentUserId={currentUserId}
              messages={messages}
              draftText={draftText}
              hasPendingImage={Boolean(pendingImageFile)}
              pendingImagePreview={pendingImagePreview}
              isSending={isSending}
              isUploadingImage={isUploadingImage}
              onDraftTextChange={setDraftText}
              onSendMessage={handleSendMessage}
              onPickImage={() => fileInputRef.current?.click()}
              onRemovePendingImage={clearPendingImage}
              onBackMobile={() => setShowMobileChat(false)}
              messagesEndRef={messagesEndRef}
            />
          </div>

          <div className={cn('flex-1 lg:hidden', showMobileChat && 'hidden')}>
            <ConversationListPanel
              conversations={conversations}
              currentUserId={currentUserId}
              selectedConversationId={selectedConversationId}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSelectConversation={(conversationId) => {
                setSelectedConversationId(conversationId)
                setShowMobileChat(true)
              }}
            />
          </div>
          <div className={cn('flex-1 lg:hidden', !showMobileChat && 'hidden')}>
            <ChatAreaPanel
              selectedConversation={selectedConversation}
              currentUserId={currentUserId}
              messages={messages}
              draftText={draftText}
              hasPendingImage={Boolean(pendingImageFile)}
              pendingImagePreview={pendingImagePreview}
              isSending={isSending}
              isUploadingImage={isUploadingImage}
              onDraftTextChange={setDraftText}
              onSendMessage={handleSendMessage}
              onPickImage={() => fileInputRef.current?.click()}
              onRemovePendingImage={clearPendingImage}
              onBackMobile={() => setShowMobileChat(false)}
              messagesEndRef={messagesEndRef}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  )
}
