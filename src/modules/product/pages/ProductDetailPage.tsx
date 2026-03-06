'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Heart,
  Share2,
  MessageSquare,
  BadgeCheck,
  MapPin,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Flag,
  ShoppingBag,
  Loader2,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/lib/utils'
import { categoryLabels, conditionLabels, departmentLabels, statusLabels } from '@/lib/types'
import type { Product } from '@/lib/types'
import { conversationsApi, listingsApi, reportsApi } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'

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

    run()
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

  const statusColors = {
    selling: 'bg-green-500/10 text-green-600 border-green-200',
    reserved: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    sold: 'bg-gray-500/10 text-gray-500 border-gray-200',
  }

  const handleShare = async () => {
    if (!product) return
    try {
      await navigator.share({
        title: product.title,
        text: `Xem san pham: ${product.title} - ${formatPrice(product.price)}`,
        url: window.location.href,
      })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Da sao chep link san pham')
    }
  }

  const handleSave = async () => {
    if (!product) return
    if (!user) {
      router.push('/auth?mode=login')
      return
    }

    setActionLoading(true)
    try {
      if (product.isSaved) {
        await listingsApi.unsave(product.id)
        setProduct({ ...product, isSaved: false })
        toast.success('Da bo luu san pham')
      } else {
        await listingsApi.save(product.id)
        setProduct({ ...product, isSaved: true })
        toast.success('Da luu san pham')
      }
    } catch {
      toast.error('Khong cap nhat duoc trang thai luu')
    } finally {
      setActionLoading(false)
    }
  }

  const handleContact = async () => {
    if (!product) return
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
      toast.error('Khong tao duoc hoi thoai')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReport = async () => {
    if (!product) return
    if (!user) {
      router.push('/auth?mode=login')
      return
    }

    setActionLoading(true)
    try {
      await reportsApi.create({
        listingId: product.id,
        reason: 'Nguoi dung bao cao bai dang nay',
      })
      toast.success('Da gui bao cao')
    } catch {
      toast.error('Khong gui duoc bao cao')
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
        <main className="flex flex-1 flex-col items-center justify-center">
          <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">San pham khong ton tai</h1>
          <p className="mb-6 text-muted-foreground">San pham nay co the da bi xoa hoac khong ton tai.</p>
          <Link href="/marketplace">
            <Button>Quay lai cho</Button>
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30 py-6">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center gap-2 text-sm">
            <Link href="/marketplace" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Quay lai cho
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{categoryLabels[product.category]}</span>
            <span className="text-muted-foreground">/</span>
            <span className="truncate">{product.title}</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                <Image
                  src={imageError[currentImageIndex] ? '/placeholder.svg' : product.images[currentImageIndex]}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority
                  onError={() => setImageError((prev) => ({ ...prev, [currentImageIndex]: true }))}
                />

                {product.status !== 'selling' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Badge className={cn('px-4 py-2 text-lg', statusColors[product.status])}>
                      {statusLabels[product.status]}
                    </Badge>
                  </div>
                )}

                {product.images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                      onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                      onClick={() => setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}

                {product.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                    {currentImageIndex + 1} / {product.images.length}
                  </div>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                        currentImageIndex === index
                          ? 'border-primary'
                          : 'border-transparent hover:border-muted-foreground/50',
                      )}
                    >
                      <Image
                        src={imageError[index] ? '/placeholder.svg' : image}
                        alt={`${product.title} - ${index + 1}`}
                        fill
                        className="object-cover"
                        onError={() => setImageError((prev) => ({ ...prev, [index]: true }))}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('border', statusColors[product.status])}>{statusLabels[product.status]}</Badge>
                <Badge variant="secondary">{categoryLabels[product.category]}</Badge>
                <Badge variant="outline">{conditionLabels[product.condition]}</Badge>
              </div>

              <h1 className="text-2xl font-bold leading-tight md:text-3xl">{product.title}</h1>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                    <Badge variant="destructive">-{discount}%</Badge>
                  </>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {product.views} luot xem
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {product.savedBy.length} luot luu
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDistanceToNow(product.createdAt, { addSuffix: true, locale: vi })}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="flex-1 gap-2" onClick={handleContact} disabled={product.status === 'sold' || actionLoading}>
                  <MessageSquare className="h-5 w-5" />
                  Nhan tin cho nguoi ban
                </Button>
                <Button
                  size="lg"
                  variant={product.isSaved ? 'default' : 'outline'}
                  onClick={handleSave}
                  className="gap-2"
                  disabled={actionLoading}
                >
                  <Heart className={cn('h-5 w-5', product.isSaved && 'fill-current')} />
                </Button>
                <Button size="lg" variant="outline" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              <Separator />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Thong tin nguoi ban</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={product.seller.avatar} alt={product.seller.name} />
                        <AvatarFallback>{product.seller.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5 font-medium">
                          {product.seller.name}
                          {product.seller.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="text-sm text-muted-foreground">MSSV: {product.seller.studentId}</div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {departmentLabels[product.seller.department]}
                      </div>
                      <div>Tham gia {format(product.seller.createdAt, 'MM/yyyy')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Mo ta san pham</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Chi tiet</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Danh muc</dt>
                      <dd className="font-medium">{categoryLabels[product.category]}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Tinh trang</dt>
                      <dd className="font-medium">{conditionLabels[product.condition]}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Nganh hoc</dt>
                      <dd className="font-medium">{departmentLabels[product.department]}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Dang ngay</dt>
                      <dd className="font-medium">{format(product.createdAt, 'dd/MM/yyyy', { locale: vi })}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground hover:text-destructive"
                onClick={handleReport}
                disabled={actionLoading}
              >
                <Flag className="h-4 w-4" />
                Bao cao bai dang nay
              </Button>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="mb-6 text-xl font-bold">San pham tuong tu</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
