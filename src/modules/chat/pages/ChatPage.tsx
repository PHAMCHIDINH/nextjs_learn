'use client'

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  Send,
  ImagePlus,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  ShoppingBag,
} from 'lucide-react'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Header } from '@/components/header'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { conversationsApi } from '@/lib/api'
import type { Conversation, Message } from '@/lib/types'
import { useAuth } from '@/providers/auth-provider'
import { toast } from 'sonner'

const REALTIME_POLL_MS = 3000

function ChatContent() {
  const searchParams = useSearchParams()
  const presetConversationId = searchParams.get('conversation')
  const productId = searchParams.get('product')
  const sellerId = searchParams.get('seller')

  const { user } = useAuth()
  const currentUserId = user?.id
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isSyncingRealtimeRef = useRef(false)

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
          setSelectedConversation(null)
          setMessages([])
          return data
        }

        let nextSelected: Conversation | null = null
        if (preferPreset && presetConversationId) {
          nextSelected = data.find((item) => item.id === presetConversationId) ?? null
        }

        if (!nextSelected && selectedConversation?.id) {
          nextSelected = data.find((item) => item.id === selectedConversation.id) ?? null
        }

        if (!nextSelected) {
          nextSelected = data[0]
        }

        setSelectedConversation(nextSelected)

        if (preferPreset && presetConversationId && nextSelected.id === presetConversationId) {
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
    [currentUserId, presetConversationId, selectedConversation?.id],
  )

  const syncMessages = useCallback(
    async (
      conversationId: string,
      { silentError = false }: { silentError?: boolean } = {},
    ) => {
      if (!currentUserId) {
        return
      }

      try {
        const result = await conversationsApi.messages(conversationId, {
          page: 1,
          limit: 100,
        })
        setMessages(result.data)

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

  useEffect(() => {
    void syncConversations({ withLoading: true, preferPreset: true })
  }, [syncConversations, currentUserId])

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
        const nextSelected = data.find((item) => item.id === conversation.id) ?? conversation
        setSelectedConversation(nextSelected)
        setShowMobileChat(true)
        await syncMessages(nextSelected.id, { silentError: true })
      } catch {
        toast.error('Khong tao duoc hoi thoai')
      }
    }

    void run()
  }, [productId, sellerId, syncConversations, syncMessages, currentUserId])

  useEffect(() => {
    if (!selectedConversation?.id || !currentUserId) {
      setMessages([])
      return
    }

    void syncMessages(selectedConversation.id)
  }, [selectedConversation?.id, syncMessages, currentUserId])

  useEffect(() => {
    if (!currentUserId) {
      return
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || isSyncingRealtimeRef.current) {
        return
      }

      isSyncingRealtimeRef.current = true
      void (async () => {
        try {
          const data = await syncConversations({ silentError: true })
          const activeConversationId =
            selectedConversation?.id ?? (data.length ? data[0].id : null)
          if (activeConversationId) {
            await syncMessages(activeConversationId, { silentError: true })
          }
        } finally {
          isSyncingRealtimeRef.current = false
        }
      })()
    }, REALTIME_POLL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [selectedConversation?.id, syncConversations, syncMessages, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedConversation])

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conv) => {
        const otherParticipant = conv.participants.find((p) => p.id !== user?.id)
        const keyword = searchQuery.toLowerCase()
        return (
          otherParticipant?.name.toLowerCase().includes(keyword) ||
          conv.product?.title.toLowerCase().includes(keyword)
        )
      }),
    [conversations, searchQuery, user?.id],
  )

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    setIsSending(true)
    try {
      const sent = await conversationsApi.sendMessage(selectedConversation.id, {
        content: newMessage.trim(),
        type: 'text',
      })
      setMessages((prev) => [...prev, sent])
      setNewMessage('')
      await syncConversations({ silentError: true })
    } catch {
      toast.error('Khong gui duoc tin nhan')
    } finally {
      setIsSending(false)
    }
  }

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) return format(date, 'HH:mm')
    if (isYesterday(date)) return `Hom qua ${format(date, 'HH:mm')}`
    return format(date, 'dd/MM HH:mm')
  }

  const ConversationList = () => (
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tim kiem tin nhan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredConversations.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredConversations.map((conv) => {
              const otherParticipant = conv.participants.find((p) => p.id !== user?.id)
              const isSelected = selectedConversation?.id === conv.id

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv)
                    setShowMobileChat(true)
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50',
                    isSelected && 'bg-muted',
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.name} />
                      <AvatarFallback>{otherParticipant?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {otherParticipant?.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{otherParticipant?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(conv.updatedAt, { addSuffix: false, locale: vi })}
                      </span>
                    </div>
                    {conv.product && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-primary">
                        <ShoppingBag className="h-3 w-3" />
                        <span className="truncate">{conv.product.title}</span>
                      </div>
                    )}
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {conv.lastMessage?.senderId === user?.id && 'Ban: '}
                      {conv.lastMessage?.content || 'Chua co tin nhan'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge className="h-5 w-5 shrink-0 rounded-full p-0 text-xs">{conv.unreadCount}</Badge>
                  )}
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

  const ChatArea = () => {
    if (!selectedConversation) {
      return (
        <div className="flex h-full flex-col items-center justify-center bg-muted/30 p-8 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Send className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Chon mot cuoc tro chuyen</h3>
          <p className="text-sm text-muted-foreground">Chon mot cuoc tro chuyen ben trai de bat dau nhan tin</p>
        </div>
      )
    }

    const otherParticipant = selectedConversation.participants.find((p) => p.id !== user?.id)

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setShowMobileChat(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.name} />
                <AvatarFallback>{otherParticipant?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {otherParticipant?.online && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
              )}
            </div>
            <div>
              <div className="font-medium">{otherParticipant?.name}</div>
              <div className="text-xs text-muted-foreground">
                {otherParticipant?.online
                  ? 'Dang hoat dong'
                  : `Hoat dong ${formatDistanceToNow(otherParticipant?.lastSeen || new Date(), {
                      addSuffix: true,
                      locale: vi,
                    })}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
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
        </div>

        {selectedConversation.product && (
          <Link
            href={`/product/${selectedConversation.product.id}`}
            className="flex items-center gap-3 border-b border-border bg-muted/50 p-3 transition-colors hover:bg-muted"
          >
            <div className="relative h-12 w-12 overflow-hidden rounded-lg">
              <Image src={selectedConversation.product.images[0]} alt={selectedConversation.product.title} fill className="object-cover" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{selectedConversation.product.title}</p>
              <p className="text-sm font-semibold text-primary">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  maximumFractionDigits: 0,
                }).format(selectedConversation.product.price)}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">
              Xem san pham
            </Badge>
          </Link>
        )}

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length > 0 ? (
              messages.map((message) => {
                const isMe = message.senderId === user?.id
                const sender = selectedConversation.participants.find((p) => p.id === message.senderId)

                return (
                  <div key={message.id} className={cn('flex items-end gap-2', isMe && 'flex-row-reverse')}>
                    {!isMe && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={sender?.avatar} alt={sender?.name} />
                        <AvatarFallback>{sender?.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn('max-w-[70%]', isMe && 'items-end')}>
                      <div className={cn('rounded-2xl px-4 py-2', isMe ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-muted')}>
                        {message.type === 'image' && message.imageUrl && (
                          <div className="mb-2 overflow-hidden rounded-lg">
                            <Image src={message.imageUrl} alt="Shared image" width={200} height={200} className="object-cover" />
                          </div>
                        )}
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className={cn('mt-1 flex items-center gap-1 text-xs text-muted-foreground', isMe && 'justify-end')}>
                        <span>{formatMessageTime(message.createdAt)}</span>
                        {isMe && (message.read ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3" />)}
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

        <div className="border-t border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" disabled>
              <ImagePlus className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Nhap tin nhan..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim() || isSending}>
              {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />

      <main className="flex flex-1 overflow-hidden">
        <div className="hidden h-full w-80 flex-shrink-0 lg:block">
          <ConversationList />
        </div>
        <div className="hidden flex-1 lg:block">
          <ChatArea />
        </div>

        <div className={cn('flex-1 lg:hidden', showMobileChat && 'hidden')}>
          <ConversationList />
        </div>
        <div className={cn('flex-1 lg:hidden', !showMobileChat && 'hidden')}>
          <ChatArea />
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
