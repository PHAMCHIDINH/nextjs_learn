'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Info, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { categoriesApi, listingsApi } from '@/lib/api'
import { categoryLabels, conditionLabels, departmentLabels } from '@/lib/types'
import type { Category, Condition, Department, Product } from '@/lib/types'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'

type EditPostPageProps = {
  params: Promise<{ id: string }>
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [isSaving, setIsSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Array<{ key: string; name: string }>>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '' as Category | '',
    condition: '' as Condition | '',
    department: '' as Department | '',
  })

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      router.replace('/auth?mode=login')
      return
    }

    const run = async () => {
      setLoadingData(true)
      try {
        const [items, detail] = await Promise.all([categoriesApi.list(), listingsApi.byId(id)])
        setCategories(items.map((item) => ({ key: item.key, name: item.name })))
        setProduct(detail)

        if (detail.seller.id !== user.id && user.role !== 'admin') {
          toast.error('Ban khong co quyen sua bai dang nay')
          router.replace('/dashboard?tab=posts')
          return
        }

        setFormData({
          title: detail.title,
          description: detail.description,
          price: String(detail.price),
          originalPrice: detail.originalPrice ? String(detail.originalPrice) : '',
          category: detail.category,
          condition: detail.condition,
          department: detail.department,
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Khong tai du lieu bai dang duoc')
        router.replace('/dashboard?tab=posts')
      } finally {
        setLoadingData(false)
      }
    }

    void run()
  }, [authLoading, id, router, user])

  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, '')
    return number ? new Intl.NumberFormat('vi-VN').format(parseInt(number, 10)) : ''
  }

  const handlePriceChange = (field: 'price' | 'originalPrice', value: string) => {
    const rawValue = value.replace(/\D/g, '')
    setFormData((prev) => ({ ...prev, [field]: rawValue }))
  }

  const categoryItems = useMemo(
    () => (categories.length ? categories : Object.entries(categoryLabels).map(([key, name]) => ({ key, name }))),
    [categories],
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!product) {
      return
    }

    if (!formData.category || !formData.condition || !formData.department) {
      toast.error('Vui long nhap day du thong tin bat buoc')
      return
    }

    setIsSaving(true)
    try {
      await listingsApi.update(product.id, {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        category: formData.category,
        condition: formData.condition,
        department: formData.department,
      })
      toast.success('Cap nhat bai dang thanh cong')
      router.push('/dashboard?tab=posts')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong cap nhat bai dang duoc')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Link href="/dashboard?tab=posts">
          <Button variant="outline">Quay lai dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.12),_transparent_24%),linear-gradient(180deg,_rgba(250,250,249,1)_0%,_rgba(244,244,245,1)_100%)]">
      <Header />

      <main className="py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Link href="/dashboard?tab=posts">
                <Button variant="outline" size="icon" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Sua bai dang</h1>
                <p className="mt-2 text-sm text-muted-foreground">Cap nhat thong tin bai dang cua ban.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="border-border/70 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Hinh anh hien tai</CardTitle>
                  <CardDescription>V1 chi cho sua thong tin, khong thay doi bo anh da tai len.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {product.images.map((image, index) => (
                      <div key={`${image}-${index}`} className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
                        <Image src={image} alt={`Anh san pham ${index + 1}`} fill className="object-cover" />
                        {index === 0 ? (
                          <div className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                            Anh bia
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Thong tin co ban</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tieu de bai dang</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                      required
                      maxLength={150}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Mo ta chi tiet</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                      required
                      rows={6}
                      maxLength={2000}
                      className="rounded-2xl"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="price">Gia ban (VND)</Label>
                      <Input
                        id="price"
                        value={formatCurrency(formData.price)}
                        onChange={(event) => handlePriceChange('price', event.target.value)}
                        required
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="originalPrice">Gia goc (VND)</Label>
                      <Input
                        id="originalPrice"
                        value={formatCurrency(formData.originalPrice)}
                        onChange={(event) => handlePriceChange('originalPrice', event.target.value)}
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Phan loai</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Danh muc</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value as Category }))}
                        required
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Chon danh muc" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryItems.map((item) => (
                            <SelectItem key={item.key} value={item.key}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tinh trang</Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, condition: value as Condition }))}
                        required
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Chon tinh trang" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(conditionLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nganh hoc lien quan</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value as Department }))}
                      required
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Chon nganh hoc" />
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
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="h-11 flex-1 rounded-full" onClick={() => router.back()}>
                  Huy
                </Button>
                <Button type="submit" className="h-11 flex-1 gap-2 rounded-full" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Dang luu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Luu thay doi
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="space-y-4">
              <Card className="border-primary/20 bg-primary/5 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-medium">Luu y</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>- Bai dang sua xong van theo trang thai kiem duyet hien tai.</li>
                    <li>- Neu can thay doi bo anh, vui long tao bai dang moi o dot tiep theo.</li>
                    <li>- Ban co the doi trang thai ban ngay trong Dashboard.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-white/90 shadow-sm">
                <CardContent className="p-5">
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    Ban dang o phien ban V1 cua tinh nang sua bai dang: uu tien thong tin san pham va gia ban.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
