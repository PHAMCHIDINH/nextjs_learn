'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Eye, MapPin, BadgeCheck, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
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

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  const statusColors = {
    selling: 'bg-green-500/10 text-green-600 border-green-200',
    reserved: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    sold: 'bg-gray-500/10 text-gray-500 border-gray-200',
  }

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
      } else {
        await listingsApi.save(product.id)
        setIsSaved(true)
      }
    } catch {
      toast.error('Khong the cap nhat trang thai luu')
    } finally {
      setSaving(false)
    }
  }

  if (variant === 'horizontal') {
    return (
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <Link href={`/product/${product.id}`} className="flex">
          <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden sm:h-40 sm:w-40">
            <Image
              src={imageError ? '/placeholder.svg' : product.images[0]}
              alt={product.title}
              fill
              priority={priority}
              className="object-cover transition-transform group-hover:scale-105"
              onError={() => setImageError(true)}
            />
            {product.status !== 'selling' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Badge className={cn('text-xs', statusColors[product.status])}>
                  {statusLabels[product.status]}
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="flex flex-1 flex-col justify-between p-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {categoryLabels[product.category]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {conditionLabels[product.condition]}
                </Badge>
              </div>
              <h3 className="line-clamp-2 font-medium group-hover:text-primary">{product.title}</h3>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="ml-2 text-sm text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />
                {product.views}
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    )
  }

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <div className="relative">
        <Link href={`/product/${product.id}`}>
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={imageError ? '/placeholder.svg' : product.images[0]}
              alt={product.title}
              fill
              priority={priority}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
            {product.images.length > 1 && (
              <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                +{product.images.length - 1}
              </div>
            )}
          </div>
        </Link>

        <Badge
          className={cn('absolute left-2 top-2 border text-xs font-medium', statusColors[product.status])}
        >
          {statusLabels[product.status]}
        </Badge>

        {discount > 0 && product.status === 'selling' && (
          <Badge className="absolute right-2 top-2 bg-destructive text-xs text-destructive-foreground">
            -{discount}%
          </Badge>
        )}

        <Button
          size="icon"
          variant="secondary"
          className={cn(
            'absolute bottom-2 right-2 h-8 w-8 rounded-full opacity-0 transition-all group-hover:opacity-100',
            isSaved && 'opacity-100',
          )}
          onClick={handleToggleSave}
          disabled={saving}
        >
          <Heart className={cn('h-4 w-4', isSaved && 'fill-red-500 text-red-500')} />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {categoryLabels[product.category]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {conditionLabels[product.condition]}
          </Badge>
        </div>

        <Link href={`/product/${product.id}`}>
          <h3 className="mb-2 line-clamp-2 text-sm font-medium leading-tight transition-colors group-hover:text-primary">
            {product.title}
          </h3>
        </Link>

        <div className="mb-3">
          <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="ml-2 text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={product.seller.avatar} alt={product.seller.name} />
              <AvatarFallback className="text-xs">{product.seller.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1">
              <span className="max-w-[80px] truncate text-xs text-muted-foreground">
                {product.seller.name}
              </span>
              {product.seller.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {product.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {product.savedBy.length}
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {departmentLabels[product.department]}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(product.createdAt, { addSuffix: true, locale: vi })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square animate-pulse bg-muted" />
      <CardContent className="p-4">
        <div className="mb-2 flex gap-1.5">
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-12 animate-pulse rounded bg-muted" />
        </div>
        <div className="mb-2 h-4 w-full animate-pulse rounded bg-muted" />
        <div className="mb-3 h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}
