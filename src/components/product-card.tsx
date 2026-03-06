'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Clock, Eye, Heart, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { cn } from '@/lib/utils'
import { listingsApi } from '@/lib/api'
import type { Product } from '@/lib/types'
import { categoryLabels, conditionLabels, departmentLabels, statusLabels } from '@/lib/types'
import { useAuth } from '@/providers/auth-provider'

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'horizontal'
  priority?: boolean
}

const statusColors = {
  selling: 'bg-emerald-500/12 text-emerald-700 border-emerald-200',
  reserved: 'bg-amber-500/12 text-amber-700 border-amber-200',
  sold: 'bg-zinc-500/12 text-zinc-600 border-zinc-200',
}

export function ProductCard({ product, variant = 'default', priority = false }: ProductCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isSaved, setIsSaved] = useState(Boolean(product.isSaved))
  const [saving, setSaving] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setIsSaved(Boolean(product.isSaved || (user ? product.savedBy.includes(user.id) : false)))
  }, [product, user])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)

  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0

  const handleToggleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    if (!user) {
      router.push('/auth?mode=login')
      return
    }

    if (saving) {
      return
    }

    setSaving(true)
    try {
      if (isSaved) {
        await listingsApi.unsave(product.id)
        setIsSaved(false)
        toast.success('Đã bỏ lưu sản phẩm')
      } else {
        await listingsApi.save(product.id)
        setIsSaved(true)
        toast.success('Đã lưu sản phẩm')
      }
    } catch {
      toast.error('Không thể cập nhật trạng thái lưu')
    } finally {
      setSaving(false)
    }
  }

  if (variant === 'horizontal') {
    return (
      <Card className="group overflow-hidden border-border/70 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <Link href={`/product/${product.id}`} className="flex flex-col sm:flex-row">
          <div className="relative h-48 overflow-hidden sm:h-auto sm:w-48 sm:flex-shrink-0">
            <Image
              src={imageError ? '/placeholder.svg' : product.images[0]}
              alt={product.title}
              fill
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
              <Badge className={cn('border bg-white/90 text-xs backdrop-blur', statusColors[product.status])}>
                {statusLabels[product.status]}
              </Badge>
              {discount > 0 && product.status === 'selling' ? (
                <Badge className="bg-destructive text-xs text-destructive-foreground">-{discount}%</Badge>
              ) : null}
            </div>
          </div>
          <CardContent className="flex flex-1 flex-col justify-between p-5">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {categoryLabels[product.category]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {conditionLabels[product.condition]}
                </Badge>
              </div>
              <h3 className="line-clamp-2 text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
                {product.title}
              </h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-primary">{formatPrice(product.price)}</span>
                {product.originalPrice ? (
                  <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                ) : null}
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-7 text-muted-foreground">{product.description}</p>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                    <AvatarImage src={product.seller.avatar} alt={product.seller.name} />
                    <AvatarFallback>{product.seller.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <span className="max-w-32 truncate">{product.seller.name}</span>
                      {product.seller.verified ? <BadgeCheck className="h-3.5 w-3.5 text-primary" /> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">{departmentLabels[product.department]}</p>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant={isSaved ? 'default' : 'secondary'}
                  className="rounded-full"
                  onClick={handleToggleSave}
                  disabled={saving}
                >
                  <Heart className={cn('h-4 w-4', isSaved && 'fill-current')} />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {product.views} lượt xem
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {product.savedBy.length} lượt lưu
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDistanceToNow(product.createdAt, { addSuffix: true, locale: vi })}
                </span>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    )
  }

  return (
    <Card className="group overflow-hidden border-border/70 bg-white/90 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="relative">
        <Link href={`/product/${product.id}`} className="block">
          <div className="relative aspect-[0.96] overflow-hidden bg-muted">
            <Image
              src={imageError ? '/placeholder.svg' : product.images[0]}
              alt={product.title}
              fill
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
              <Badge className={cn('border bg-white/90 text-xs backdrop-blur', statusColors[product.status])}>
                {statusLabels[product.status]}
              </Badge>
              {discount > 0 && product.status === 'selling' ? (
                <Badge className="bg-destructive text-xs text-destructive-foreground">-{discount}%</Badge>
              ) : null}
            </div>
            {product.images.length > 1 ? (
              <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white">
                +{product.images.length - 1} ảnh
              </div>
            ) : null}
          </div>
        </Link>

        <Button
          size="icon"
          variant={isSaved ? 'default' : 'secondary'}
          className={cn(
            'absolute bottom-3 right-3 h-9 w-9 rounded-full shadow-md transition-all',
            !isSaved && 'opacity-0 group-hover:opacity-100',
          )}
          onClick={handleToggleSave}
          disabled={saving}
        >
          <Heart className={cn('h-4 w-4', isSaved && 'fill-current')} />
        </Button>
      </div>

      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {categoryLabels[product.category]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {conditionLabels[product.condition]}
          </Badge>
        </div>

        <div>
          <Link href={`/product/${product.id}`}>
            <h3 className="line-clamp-2 text-base font-semibold leading-tight tracking-tight transition-colors group-hover:text-primary">
              {product.title}
            </h3>
          </Link>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-semibold text-primary">{formatPrice(product.price)}</span>
            {product.originalPrice ? (
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-primary/10">
              <AvatarImage src={product.seller.avatar} alt={product.seller.name} />
              <AvatarFallback>{product.seller.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-sm font-medium">
                <span className="truncate">{product.seller.name}</span>
                {product.seller.verified ? <BadgeCheck className="h-3.5 w-3.5 text-primary" /> : null}
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {departmentLabels[product.department]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {product.views} lượt xem
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {product.savedBy.length} lượt lưu
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDistanceToNow(product.createdAt, { addSuffix: true, locale: vi })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/70 bg-white/90">
      <div className="aspect-[0.96] animate-pulse bg-muted" />
      <CardContent className="space-y-4 p-4">
        <div className="flex gap-2">
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="rounded-2xl border border-border/70 p-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}
