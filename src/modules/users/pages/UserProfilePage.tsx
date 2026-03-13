'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, Loader2, MessageSquare, Star } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { ProductCard } from '@/components/product-card'
import { usersApi } from '@/lib/api'
import { departmentLabels, type Product, type PublicUserProfile } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'

type UserProfilePageProps = {
  params: Promise<{ id: string }>
}

const PAGE_SIZE = 12

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = use(params)

  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const [profileResponse, listingsResponse] = await Promise.all([
          usersApi.getPublicProfile(id),
          usersApi.publicListings(id, {
            page: 1,
            limit: PAGE_SIZE,
            status: 'selling',
          }),
        ])

        setProfile(profileResponse)
        setProducts(listingsResponse.data)
        setPage(1)
        setHasMore(listingsResponse.meta.page < listingsResponse.meta.totalPages)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Khong tai duoc thong tin nguoi dung')
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [id])

  const loadMore = async () => {
    if (!hasMore || loadingMore) {
      return
    }

    const nextPage = page + 1
    setLoadingMore(true)
    try {
      const response = await usersApi.publicListings(id, {
        page: nextPage,
        limit: PAGE_SIZE,
        status: 'selling',
      })

      setProducts((previous) => [...previous, ...response.data])
      setPage(nextPage)
      setHasMore(response.meta.page < response.meta.totalPages)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <main className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </PageShell>
    )
  }

  if (error || !profile) {
    return (
      <PageShell>
        <main className="container mx-auto px-4 py-16 text-center">
          <p className="text-sm text-destructive">{error ?? 'Khong tim thay nguoi dung'}</p>
          <Link href="/marketplace" className="mt-4 inline-flex">
            <Button variant="outline">Quay lai marketplace</Button>
          </Link>
        </main>
      </PageShell>
    )
  }

  return (
    <PageShell className="bg-[linear-gradient(180deg,_rgba(250,250,249,1)_0%,_rgba(244,244,245,1)_100%)]">
      <main className="container mx-auto space-y-8 px-4 py-8">
        <Card className="border-border/70 bg-white/90 shadow-sm">
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 ring-2 ring-primary/10">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold">{profile.name}</h1>
                  {profile.isVerified ? <BadgeCheck className="h-5 w-5 text-primary" /> : null}
                </div>
                <p className="text-sm text-muted-foreground">MSSV: {profile.studentId}</p>
                <p className="text-sm text-muted-foreground">
                  Khoa: {profile.department ? departmentLabels[profile.department] : 'Dang cap nhat'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tham gia: {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(profile.createdAt)}
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:text-right">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{profile.sellerRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({profile.totalReviews} danh gia)</span>
              </div>
              <div>
                <Link href={`/chat?seller=${profile.id}`}>
                  <Button className="gap-2 rounded-full">
                    <MessageSquare className="h-4 w-4" />
                    Nhan tin
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Bai dang dang ban</h2>
          {products.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <div key={product.id} className="space-y-2">
                    <ProductCard product={product} />
                    <Link href={`/chat?seller=${profile.id}&product=${product.id}`} className="block">
                      <Button variant="outline" className="w-full rounded-full">
                        Nhan tin ve san pham nay
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
              {hasMore ? (
                <div className="pt-2 text-center">
                  <Button onClick={loadMore} disabled={loadingMore} variant="outline" className="rounded-full">
                    {loadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Dang tai...
                      </>
                    ) : (
                      'Tai them'
                    )}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nguoi dung nay chua co bai dang dang ban.
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </PageShell>
  )
}
