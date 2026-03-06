'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User,
  Package,
  Heart,
  MessageSquare,
  Edit,
  Eye,
  MoreVertical,
  Plus,
  BadgeCheck,
  GraduationCap,
  Mail,
  Calendar,
  Loader2,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/shared/ui/sheet'
import { cn } from '@/lib/utils'
import { conversationsApi, dashboardApi, listingsApi, uploadsApi, usersApi } from '@/lib/api'
import type { Conversation, DashboardSummary, Department, Product, ProductStatus } from '@/lib/types'
import { categoryLabels, departmentLabels, statusLabels } from '@/lib/types'
import { useAuth } from '@/providers/auth-provider'

const AVATAR_MAX_FILE_SIZE = 5 * 1024 * 1024
const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const revokeBlobUrl = (value?: string | null) => {
  if (value?.startsWith('blob:')) {
    URL.revokeObjectURL(value)
  }
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'overview'
  const { user, loading: authLoading, refreshMe } = useAuth()

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [myProducts, setMyProducts] = useState<Product[]>([])
  const [savedProducts, setSavedProducts] = useState<Product[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileDepartment, setProfileDepartment] = useState<Department>('cntt')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const loadDashboard = async () => {
    if (!user) {
      return
    }

    setLoading(true)
    try {
      const [summaryData, myListingsData, savedData, convData] = await Promise.all([
        dashboardApi.summary(),
        usersApi.myListings({ page: 1, limit: 50 }),
        usersApi.mySavedListings({ page: 1, limit: 50 }),
        conversationsApi.list(),
      ])

      setSummary(summaryData)
      setMyProducts(myListingsData.data)
      setSavedProducts(savedData.data)
      setConversations(convData)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không tải dữ liệu dashboard được')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(
    () => () => {
      revokeBlobUrl(avatarPreview)
    },
    [avatarPreview],
  )

  const syncProfileDraftFromUser = () => {
    if (!user) {
      return
    }

    revokeBlobUrl(avatarPreview)
    setProfileName(user.name)
    setProfileDepartment(user.department)
    setAvatarPreview(user.avatar ?? null)
    setAvatarFile(null)
    setAvatarRemoved(false)
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
  }

  const openEditProfile = () => {
    syncProfileDraftFromUser()
    setIsEditProfileOpen(true)
  }

  const handleEditProfileOpenChange = (open: boolean) => {
    setIsEditProfileOpen(open)
    if (!open) {
      syncProfileDraftFromUser()
    }
  }

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!AVATAR_MIME_TYPES.includes(file.type)) {
      toast.error('Avatar chỉ hỗ trợ JPG, PNG, WEBP')
      event.target.value = ''
      return
    }

    if (file.size > AVATAR_MAX_FILE_SIZE) {
      toast.error('Avatar tối đa 5MB')
      event.target.value = ''
      return
    }

    const previewUrl = URL.createObjectURL(file)
    revokeBlobUrl(avatarPreview)
    setAvatarPreview(previewUrl)
    setAvatarFile(file)
    setAvatarRemoved(false)
  }

  const removeAvatar = () => {
    revokeBlobUrl(avatarPreview)
    setAvatarPreview(null)
    setAvatarFile(null)
    setAvatarRemoved(true)
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
  }

  const hasProfileChanges =
    !!user &&
    (profileName.trim() !== user.name ||
      profileDepartment !== user.department ||
      avatarFile !== null ||
      (avatarRemoved && Boolean(user.avatar)))

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) {
      return
    }

    const trimmedName = profileName.trim()
    if (trimmedName.length < 2) {
      toast.error('Tên cần ít nhất 2 ký tự')
      return
    }

    const payload: {
      name?: string
      department?: Department
      avatar?: { url: string; publicId?: string } | null
    } = {}

    if (trimmedName !== user.name) {
      payload.name = trimmedName
    }

    if (profileDepartment !== user.department) {
      payload.department = profileDepartment
    }

    setIsSavingProfile(true)
    try {
      if (avatarRemoved) {
        payload.avatar = null
      } else if (avatarFile) {
        const uploaded = await uploadsApi.uploadAvatar(avatarFile)
        payload.avatar = {
          url: uploaded.data.url,
          publicId: uploaded.data.publicId,
        }
      }

      if (!('name' in payload) && !('department' in payload) && !('avatar' in payload)) {
        setIsEditProfileOpen(false)
        return
      }

      await usersApi.updateMe(payload)
      await refreshMe()
      revokeBlobUrl(avatarPreview)
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ''
      }
      setAvatarFile(null)
      setAvatarRemoved(false)
      setIsEditProfileOpen(false)
      toast.success('Đã cập nhật hồ sơ')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không cập nhật hồ sơ được')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const recentConversations = useMemo(() => conversations.slice(0, 3), [conversations])

  const stats = [
    { label: 'Bài đăng', value: summary?.myPosts ?? myProducts.length, icon: Package, color: 'text-blue-600' },
    {
      label: 'Đang bán',
      value: summary?.selling ?? myProducts.filter((p) => p.status === 'selling').length,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    { label: 'Đã lưu', value: summary?.saved ?? savedProducts.length, icon: Heart, color: 'text-red-600' },
    { label: 'Tin nhắn', value: summary?.conversations ?? conversations.length, icon: MessageSquare, color: 'text-purple-600' },
  ]

  const totalViews = summary?.totalViews ?? myProducts.reduce((acc, p) => acc + p.views, 0)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)

  const handleDeletePost = async (productId: string) => {
    try {
      await listingsApi.remove(productId)
      setMyProducts((prev) => prev.filter((item) => item.id !== productId))
      toast.success('Đã xóa bài đăng thành công')
    } catch {
      toast.error('Không xóa bài đăng được')
    }
  }

  const handleUpdateStatus = async (productId: string, nextStatus: ProductStatus) => {
    const previous = myProducts.find((item) => item.id === productId)
    if (!previous || previous.status === nextStatus) {
      return
    }

    setMyProducts((prev) => prev.map((item) => (item.id === productId ? { ...item, status: nextStatus } : item)))
    try {
      const updated = await listingsApi.updateStatus(productId, nextStatus)
      setMyProducts((prev) => prev.map((item) => (item.id === productId ? updated : item)))
      toast.success('Da cap nhat trang thai bai dang')
    } catch (error) {
      setMyProducts((prev) => prev.map((item) => (item.id === productId ? previous : item)))
      toast.error(error instanceof Error ? error.message : 'Khong cap nhat trang thai duoc')
    }
  }

  const statusColors = {
    selling: 'bg-green-500/10 text-green-600',
    reserved: 'bg-yellow-500/10 text-yellow-600',
    sold: 'bg-gray-500/10 text-gray-500',
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Link href="/auth?mode=login">
          <Button>Đăng nhập để xem dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <AppShell
      title="Dashboard"
      description="Quản lý tài khoản và bài đăng của bạn"
      actions={
        <Link href="/post/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Đăng tin mới
          </Button>
        </Link>
      }
    >
      <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 md:w-auto md:grid-cols-none">
              <TabsTrigger value="overview" className="gap-2">
                <User className="hidden h-4 w-4 md:block" />
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="posts" className="gap-2">
                <Package className="hidden h-4 w-4 md:block" />
                Bài đăng
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2">
                <Heart className="hidden h-4 w-4 md:block" />
                Đã lưu
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2">
                <MessageSquare className="hidden h-4 w-4 md:block" />
                Tin nhắn
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-6 md:flex-row">
                    <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center md:text-left">
                      <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
                        <h2 className="text-2xl font-bold">{user.name}</h2>
                        {user.verified && <BadgeCheck className="h-6 w-6 text-primary" />}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-2 md:justify-start">
                          <GraduationCap className="h-4 w-4" />
                          <span>MSSV: {user.studentId}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 md:justify-start">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 md:justify-start">
                          <Calendar className="h-4 w-4" />
                          <span>Tham gia {format(user.createdAt, 'dd/MM/yyyy')}</span>
                        </div>
                      </div>
                      <Badge className="mt-3" variant="secondary">
                        {departmentLabels[user.department]}
                      </Badge>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={openEditProfile}>
                      <Edit className="h-4 w-4" />
                      Chỉnh sửa
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className={cn('rounded-lg p-3', stat.color.replace('text-', 'bg-').replace('600', '100'))}>
                        <stat.icon className={cn('h-6 w-6', stat.color)} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Thống kê lượt xem</CardTitle>
                    <CardDescription>Tổng lượt xem các bài đăng của bạn</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Eye className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">{totalViews.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">lượt xem</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tin nhắn gần đây</CardTitle>
                    <CardDescription>Các cuộc trò chuyện mới nhất</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentConversations.length > 0 ? (
                      <div className="space-y-3">
                        {recentConversations.map((conv) => {
                          const otherParticipant = conv.participants.find((p) => p.id !== user.id)
                          return (
                            <Link
                              key={conv.id}
                              href={`/chat?conversation=${conv.id}`}
                              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={otherParticipant?.avatar} />
                                <AvatarFallback>{otherParticipant?.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 overflow-hidden">
                                <p className="truncate font-medium">{otherParticipant?.name}</p>
                                <p className="truncate text-sm text-muted-foreground">{conv.lastMessage?.content}</p>
                              </div>
                              {conv.unreadCount > 0 && (
                                <Badge className="h-5 w-5 rounded-full p-0 text-xs">{conv.unreadCount}</Badge>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa có tin nhắn nào</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="posts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bài đăng của tôi</CardTitle>
                  <CardDescription>Quản lý tất cả bài đăng bán hàng của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  {myProducts.length > 0 ? (
                    <div className="divide-y divide-border">
                      {myProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                            <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="mb-1 flex items-center gap-2">
                              <Badge className={cn('text-xs', statusColors[product.status])}>{statusLabels[product.status]}</Badge>
                              <Badge variant="outline" className="text-xs">
                                {categoryLabels[product.category]}
                              </Badge>
                            </div>
                            <Link href={`/product/${product.id}`} className="line-clamp-1 font-medium hover:text-primary">
                              {product.title}
                            </Link>
                            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="font-semibold text-primary">{formatPrice(product.price)}</span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {product.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {product.savedBy.length}
                              </span>
                              <span>{formatDistanceToNow(product.createdAt, { addSuffix: true, locale: vi })}</span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/product/${product.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Xem chi tiết
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/post/${product.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Sua bai dang
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void handleUpdateStatus(product.id, 'selling')}>
                                Dat trang thai: {statusLabels.selling}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void handleUpdateStatus(product.id, 'reserved')}>
                                Dat trang thai: {statusLabels.reserved}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void handleUpdateStatus(product.id, 'sold')}>
                                Dat trang thai: {statusLabels.sold}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePost(product.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa bài đăng
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 font-semibold">Chưa có bài đăng nào</h3>
                      <p className="mb-4 text-sm text-muted-foreground">Bắt đầu bán đồ của bạn bằng cách tạo bài đăng mới</p>
                      <Link href="/post/new">
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Đăng tin mới
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="saved" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sản phẩm đã lưu</CardTitle>
                  <CardDescription>Các sản phẩm bạn đã lưu để xem sau</CardDescription>
                </CardHeader>
                <CardContent>
                  {savedProducts.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {savedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Heart className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 font-semibold">Chưa lưu sản phẩm nào</h3>
                      <p className="mb-4 text-sm text-muted-foreground">Lưu những sản phẩm bạn quan tâm để xem lại sau</p>
                      <Link href="/marketplace">
                        <Button variant="outline">Khám phá chợ</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tin nhắn</CardTitle>
                  <CardDescription>Tất cả cuộc trò chuyện của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  {conversations.length > 0 ? (
                    <div className="divide-y divide-border">
                      {conversations.map((conv) => {
                        const otherParticipant = conv.participants.find((p) => p.id !== user.id)
                        return (
                          <Link
                            key={conv.id}
                            href={`/chat?conversation=${conv.id}`}
                            className="flex items-center gap-4 py-4 transition-colors hover:bg-muted/50 first:pt-0 last:pb-0"
                          >
                            <div className="relative">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={otherParticipant?.avatar} />
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
                                  {formatDistanceToNow(conv.updatedAt, { addSuffix: true, locale: vi })}
                                </span>
                              </div>
                              {conv.product && <p className="truncate text-xs text-primary">{conv.product.title}</p>}
                              <p className="truncate text-sm text-muted-foreground">
                                {conv.lastMessage?.senderId === user.id && 'Bạn: '}
                                {conv.lastMessage?.content}
                              </p>
                            </div>
                            {conv.unreadCount > 0 && (
                              <Badge className="h-5 w-5 shrink-0 rounded-full p-0 text-xs">{conv.unreadCount}</Badge>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 font-semibold">Chưa có tin nhắn nào</h3>
                      <p className="text-sm text-muted-foreground">Bắt đầu trò chuyện với người bán từ trang sản phẩm</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
      </Tabs>

      <Sheet open={isEditProfileOpen} onOpenChange={handleEditProfileOpenChange}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b bg-muted/40 px-6 py-5">
            <SheetTitle className="text-xl">Chỉnh sửa hồ sơ</SheetTitle>
            <SheetDescription>Cập nhật thông tin hiển thị và ảnh đại diện của bạn.</SheetDescription>
          </SheetHeader>

          <form className="flex h-[calc(100dvh-84px)] flex-col" onSubmit={(event) => void handleSaveProfile(event)}>
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-background to-background p-4">
                <Label className="text-sm font-medium">Ảnh đại diện</Label>
                <div className="mt-3 flex items-center gap-4">
                  <Avatar className="h-20 w-20 ring-4 ring-primary/15">
                    <AvatarImage src={avatarPreview ?? undefined} alt={profileName || user.name} />
                    <AvatarFallback className="text-xl">{(profileName || user.name).charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept={AVATAR_MIME_TYPES.join(',')}
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Tải avatar mới
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={removeAvatar}
                        disabled={!avatarPreview && !avatarFile && !user.avatar}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Xóa avatar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG hoặc WEBP. Tối đa 5MB.
                      {avatarFile ? ` Đã chọn: ${avatarFile.name}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-border/70 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="profile-name">Tên hiển thị</Label>
                    <span className="text-xs text-muted-foreground">{profileName.length}/100</span>
                  </div>
                  <Input
                    id="profile-name"
                    value={profileName}
                    minLength={2}
                    maxLength={100}
                    onChange={(event) => setProfileName(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ngành học</Label>
                  <Select value={profileDepartment} onValueChange={(value) => setProfileDepartment(value as Department)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(departmentLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4">
                <p className="text-sm font-medium">Thông tin tài khoản (chỉ đọc)</p>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>MSSV</Label>
                  <Input value={user.studentId} disabled />
                </div>
              </div>
            </div>

            <SheetFooter className="border-t bg-background/95 px-6 py-4 backdrop-blur">
              <div className="flex w-full gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditProfileOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" className="flex-1" disabled={!hasProfileChanges || isSavingProfile}>
                  {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
