'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
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
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { conversationsApi, dashboardApi, listingsApi, usersApi } from '@/lib/api'
import type { Conversation, DashboardSummary, Product } from '@/lib/types'
import { categoryLabels, departmentLabels, statusLabels } from '@/lib/types'
import { useAuth } from '@/providers/auth-provider'

function DashboardContent() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'overview'
  const { user, loading: authLoading } = useAuth()

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [myProducts, setMyProducts] = useState<Product[]>([])
  const [savedProducts, setSavedProducts] = useState<Product[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

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
      toast.error(error instanceof Error ? error.message : 'Khong tai du lieu dashboard duoc')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const recentConversations = useMemo(() => conversations.slice(0, 3), [conversations])

  const stats = [
    { label: 'Bai dang', value: summary?.myPosts ?? myProducts.length, icon: Package, color: 'text-blue-600' },
    {
      label: 'Dang ban',
      value: summary?.selling ?? myProducts.filter((p) => p.status === 'selling').length,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    { label: 'Da luu', value: summary?.saved ?? savedProducts.length, icon: Heart, color: 'text-red-600' },
    { label: 'Tin nhan', value: summary?.conversations ?? conversations.length, icon: MessageSquare, color: 'text-purple-600' },
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
      toast.success('Da xoa bai dang thanh cong')
    } catch {
      toast.error('Khong xoa bai dang duoc')
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
          <Button>Dang nhap de xem dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30 py-6">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Quan ly tai khoan va bai dang cua ban</p>
            </div>
            <Link href="/post/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Dang tin moi
              </Button>
            </Link>
          </div>

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 md:w-auto md:grid-cols-none">
              <TabsTrigger value="overview" className="gap-2">
                <User className="hidden h-4 w-4 md:block" />
                Tong quan
              </TabsTrigger>
              <TabsTrigger value="posts" className="gap-2">
                <Package className="hidden h-4 w-4 md:block" />
                Bai dang
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2">
                <Heart className="hidden h-4 w-4 md:block" />
                Da luu
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2">
                <MessageSquare className="hidden h-4 w-4 md:block" />
                Tin nhan
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
                    <Button variant="outline" className="gap-2" disabled>
                      <Edit className="h-4 w-4" />
                      Chinh sua
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
                    <CardTitle className="text-lg">Thong ke luot xem</CardTitle>
                    <CardDescription>Tong luot xem cac bai dang cua ban</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Eye className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">{totalViews.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">luot xem</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tin nhan gan day</CardTitle>
                    <CardDescription>Cac cuoc tro chuyen moi nhat</CardDescription>
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
                      <p className="text-sm text-muted-foreground">Chua co tin nhan nao</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="posts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bai dang cua toi</CardTitle>
                  <CardDescription>Quan ly tat ca bai dang ban hang cua ban</CardDescription>
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
                                  Xem chi tiet
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePost(product.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xoa bai dang
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 font-semibold">Chua co bai dang nao</h3>
                      <p className="mb-4 text-sm text-muted-foreground">Bat dau ban do cua ban bang cach tao bai dang moi</p>
                      <Link href="/post/new">
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Dang tin moi
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
                  <CardTitle>San pham da luu</CardTitle>
                  <CardDescription>Cac san pham ban da luu de xem sau</CardDescription>
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
                      <h3 className="mb-2 font-semibold">Chua luu san pham nao</h3>
                      <p className="mb-4 text-sm text-muted-foreground">Luu nhung san pham ban quan tam de xem lai sau</p>
                      <Link href="/marketplace">
                        <Button variant="outline">Kham pha cho</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tin nhan</CardTitle>
                  <CardDescription>Tat ca cuoc tro chuyen cua ban</CardDescription>
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
                                {conv.lastMessage?.senderId === user.id && 'Ban: '}
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
                      <h3 className="mb-2 font-semibold">Chua co tin nhan nao</h3>
                      <p className="text-sm text-muted-foreground">Bat dau tro chuyen voi nguoi ban tu trang san pham</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
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
