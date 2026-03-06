'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Flag,
  Heart,
  Loader2,
  MapPin,
  MessageSquare,
  Share2,
  ShoppingBag,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { conversationsApi, listingsApi, reportsApi } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import type { Product } from '@/lib/types'
import { categoryLabels, conditionLabels, departmentLabels, statusLabels } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/lib/utils'

const statusColors = {
  selling: 'bg-emerald-500/12 text-emerald-700 border-emerald-200',
  reserved: 'bg-amber-500/12 text-amber-700 border-amber-200',
  sold: 'bg-zinc-500/12 text-zinc-600 border-zinc-200',
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageError, setImageError] = useState<Record<number, boolean>>({})
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      setIsLoading(true)
      try {
        const detail = await listingsApi.byId(id)
        setProduct(detail)

        const related = await listingsApi.list({
          category: detail.category,
          limit: 8,
          sortBy: 'newest',
        })
        setRelatedProducts(related.data.filter((item) => item.id !== detail.id).slice(0, 4))
      } catch {
        setProduct(null)
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }, [id])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)

  const discount = useMemo(
    () => (product?.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0),
    [product],
  )

  const handleShare = async () => {
    if (!product) {
      return
    }

    try {
      await navigator.share({
        title: product.title,
        text: `Xem sản phẩm: ${product.title} - ${formatPrice(product.price)}`,
        url: window.location.href,
      })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép liên kết sản phẩm')
    }
  }

  const handleSave = async () => {
    if (!product) {
      return
    }

    if (!user) {
      router.push('/auth?mode=login')
      return
    }

    setActionLoading(true)
    try {
      if (product.isSaved) {
        await listingsApi.unsave(product.id)
        setProduct({ ...product, isSaved: false })
        toast.success('Đã bỏ lưu sản phẩm')
      } else {
        await listingsApi.save(product.id)
        setProduct({ ...product, isSaved: true })
        toast.success('Đã lưu sản phẩm')
      }
    } catch {
      toast.error('Không cập nhật được trạng thái lưu')
    } finally {
      setActionLoading(false)
    }
  }

  const handleContact = async () => {
    if (!product) {
      return
    }

    if (!user) {
      router.push('/auth?mode=login')
      return
    }

    setActionLoading(true)
    try {
      const conversation = await conversationsApi.create({
        participantId: product.seller.id,
        productId: product.id,
      })
      router.push(`/chat?conversation=${conversation.id}`)
    } catch {
      toast.error('Không tạo được hội thoại')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReport = async () => {
    if (!product) {
      return
    }

    if (!user) {
      router.push('/auth?mode=login')
      return
    }

    setActionLoading(true)
    try {
      await reportsApi.create({
        listingId: product.id,
        reason: 'Người dùng báo cáo bài đăng này',
      })
      toast.success('Đã gửi báo cáo')
    } catch {
      toast.error('Không gửi được báo cáo')
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">Sản phẩm không tồn tại</h1>
          <p className="mb-6 text-muted-foreground">Sản phẩm này có thể đã bị xóa hoặc hiện không còn hiển thị.</p>
          <Link href="/marketplace">
            <Button>Quay lại chợ</Button>
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_rgba(250,250,249,1)_0%,_rgba(244,244,245,1)_100%)]">
      <Header />

      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/marketplace" className="inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Quay lại chợ
            </Link>
            <span>/</span>
            <span>{categoryLabels[product.category]}</span>
            <span>/</span>
            <span className="truncate text-foreground">{product.title}</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-white shadow-sm">
                <div className="relative aspect-square">
                  <Image
                    src={imageError[currentImageIndex] ? '/placeholder.svg' : product.images[currentImageIndex]}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                    onError={() => setImageError((prev) => ({ ...prev, [currentImageIndex]: true }))}
                  />
                </div>

                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                  <Badge className={cn('border bg-white/90 text-xs backdrop-blur', statusColors[product.status])}>
                    {statusLabels[product.status]}
                  </Badge>
                  {discount > 0 && product.status === 'selling' ? (
                    <Badge className="bg-destructive text-destructive-foreground">-{discount}%</Badge>
                  ) : null}
                </div>

                {product.images.length > 1 ? (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full"
                      onClick={() =>
                        setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
                      }
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full"
                      onClick={() =>
                        setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
                      }
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                      {currentImageIndex + 1} / {product.images.length}
                    </div>
                  </>
                ) : null}
              </div>

              {product.images.length > 1 ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        'relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all',
                        currentImageIndex === index ? 'border-primary' : 'border-transparent hover:border-muted-foreground/40',
                      )}
                    >
                      <Image
                        src={imageError[index] ? '/placeholder.svg' : image}
                        alt={`${product.title} - ảnh ${index + 1}`}
                        fill
                        className="object-cover"
                        onError={() => setImageError((prev) => ({ ...prev, [index]: true }))}
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <Card className="border-border/70 bg-white/92 shadow-sm">
                <CardContent className="space-y-6 p-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn('border bg-white text-xs', statusColors[product.status])}>{statusLabels[product.status]}</Badge>
                    <Badge variant="secondary">{categoryLabels[product.category]}</Badge>
                    <Badge variant="outline">{conditionLabels[product.condition]}</Badge>
                  </div>

                  <div>
                    <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{product.title}</h1>
                    <div className="mt-4 flex items-baseline gap-3">
                      <span className="text-4xl font-semibold text-primary">{formatPrice(product.price)}</span>
                      {product.originalPrice ? (
                        <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {product.views} lượt xem
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {product.savedBy.length} lượt lưu
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(product.createdAt, { addSuffix: true, locale: vi })}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                    <Button size="lg" className="gap-2 rounded-full" onClick={handleContact} disabled={product.status === 'sold' || actionLoading}>
                      <MessageSquare className="h-5 w-5" />
                      Nhắn tin cho người bán
                    </Button>
                    <Button size="lg" variant={product.isSaved ? 'default' : 'outline'} className="rounded-full" onClick={handleSave} disabled={actionLoading}>
                      <Heart className={cn('h-5 w-5', product.isSaved && 'fill-current')} />
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-full" onClick={handleShare}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-white/92 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Thông tin người bán</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                        <AvatarImage src={product.seller.avatar} alt={product.seller.name} />
                        <AvatarFallback>{product.seller.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5 font-medium">
                          {product.seller.name}
                          {product.seller.verified ? <BadgeCheck className="h-4 w-4 text-primary" /> : null}
                        </div>
                        <div className="text-sm text-muted-foreground">MSSV: {product.seller.studentId}</div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {departmentLabels[product.seller.department]}
                      </div>
                      <div>Tham gia {format(product.seller.createdAt, 'MM/yyyy')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-white/92 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Mô tả sản phẩm</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm leading-8 text-muted-foreground">{product.description}</p>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-white/92 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Chi tiết</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                      <dt className="text-sm text-muted-foreground">Danh mục</dt>
                      <dd className="mt-1 font-medium">{categoryLabels[product.category]}</dd>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                      <dt className="text-sm text-muted-foreground">Tình trạng</dt>
                      <dd className="mt-1 font-medium">{conditionLabels[product.condition]}</dd>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                      <dt className="text-sm text-muted-foreground">Ngành học</dt>
                      <dd className="mt-1 font-medium">{departmentLabels[product.department]}</dd>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                      <dt className="text-sm text-muted-foreground">Đăng ngày</dt>
                      <dd className="mt-1 font-medium">{format(product.createdAt, 'dd/MM/yyyy', { locale: vi })}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Separator />

              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground hover:text-destructive"
                onClick={handleReport}
                disabled={actionLoading}
              >
                <Flag className="h-4 w-4" />
                Báo cáo bài đăng này
              </Button>
            </div>
          </div>

          {relatedProducts.length > 0 ? (
            <section className="mt-16">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Sản phẩm tương tự</h2>
                  <p className="text-sm text-muted-foreground">Một vài gợi ý cùng danh mục để bạn so sánh nhanh hơn.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {relatedProducts.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  )
}
