'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Upload, X, ImagePlus, Loader2, Info } from 'lucide-react'
import { Header } from '@/components/header'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { categoriesApi, listingsApi } from '@/lib/api'
import { categoryLabels, conditionLabels, departmentLabels } from '@/lib/types'
import type { Category, Condition, Department } from '@/lib/types'
import { useAuth } from '@/providers/auth-provider'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const sampleImages = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=400&h=400&fit=crop',
]

export default function CreatePostPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [categories, setCategories] = useState<Array<{ key: string; name: string }>>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '' as Category | '',
    condition: '' as Condition | '',
    department: (user?.department ?? '') as Department | '',
  })

  useEffect(() => {
    if (!user) {
      router.replace('/auth?mode=login')
      return
    }

    const run = async () => {
      try {
        const items = await categoriesApi.list()
        setCategories(items.map((item) => ({ key: item.key, name: item.name })))
      } catch {
        setCategories(Object.entries(categoryLabels).map(([key, name]) => ({ key, name })))
      }
    }

    run()
  }, [router, user])

  const handleImageUpload = () => {
    if (images.length >= 5) {
      toast.error('Toi da 5 anh')
      return
    }
    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)]
    setImages([...images, `${randomImage}&random=${Date.now()}`])
    toast.success('Da them anh mau')
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      router.push('/auth?mode=login')
      return
    }

    if (images.length === 0) {
      toast.error('Vui long tai len it nhat 1 anh')
      return
    }

    if (!formData.category || !formData.condition || !formData.department) {
      toast.error('Vui long nhap day du thong tin bat buoc')
      return
    }

    setIsLoading(true)
    try {
      await listingsApi.create({
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        category: formData.category,
        condition: formData.condition,
        department: formData.department,
        images,
      })

      toast.success('Dang tin thanh cong, bai dang dang cho duyet')
      router.push('/dashboard?tab=posts')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong dang tin duoc')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, '')
    return number ? new Intl.NumberFormat('vi-VN').format(parseInt(number, 10)) : ''
  }

  const handlePriceChange = (field: 'price' | 'originalPrice', value: string) => {
    const rawValue = value.replace(/\D/g, '')
    setFormData({ ...formData, [field]: rawValue })
  }

  const categoryItems = useMemo(
    () =>
      categories.length
        ? categories
        : Object.entries(categoryLabels).map(([key, name]) => ({ key, name })),
    [categories],
  )

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header />

      <main className="flex-1 py-6">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/marketplace">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Dang tin moi</h1>
              <p className="text-sm text-muted-foreground">Dien thong tin san pham ban muon ban</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hinh anh san pham</CardTitle>
                <CardDescription>Tai len toi da 5 anh. Anh dau tien se la anh bia.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {images.map((image, index) => (
                    <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                      <Image src={image} alt={`Product ${index + 1}`} fill className="object-cover" />
                      {index === 0 && (
                        <div className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                          Anh bia
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragOver(true)
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDragOver(false)
                        handleImageUpload()
                      }}
                      className={cn(
                        'flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                        dragOver
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50',
                      )}
                    >
                      <ImagePlus className="mb-1 h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Them anh</span>
                    </button>
                  )}
                </div>

                <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" />
                  Chap nhan JPG, PNG. Toi da 5MB moi anh.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thong tin co ban</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tieu de bai dang *</Label>
                  <Input
                    id="title"
                    placeholder="VD: Giao trinh Kinh te Vi mo - Nhu moi"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    maxLength={150}
                  />
                  <p className="text-right text-xs text-muted-foreground">{formData.title.length}/150</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mo ta chi tiet *</Label>
                  <Textarea
                    id="description"
                    placeholder="Mo ta chi tiet ve san pham"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={5}
                    maxLength={2000}
                  />
                  <p className="text-right text-xs text-muted-foreground">{formData.description.length}/2000</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Gia ban (VND) *</Label>
                    <Input
                      id="price"
                      placeholder="0"
                      value={formatCurrency(formData.price)}
                      onChange={(e) => handlePriceChange('price', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Gia goc (VND)</Label>
                    <Input
                      id="originalPrice"
                      placeholder="Khong bat buoc"
                      value={formatCurrency(formData.originalPrice)}
                      onChange={(e) => handlePriceChange('originalPrice', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phan loai</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Danh muc *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as Category })}
                      required
                    >
                      <SelectTrigger>
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
                    <Label>Tinh trang *</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData({ ...formData, condition: value as Condition })}
                      required
                    >
                      <SelectTrigger>
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
                  <Label>Nganh hoc lien quan *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value as Department })}
                    required
                  >
                    <SelectTrigger>
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

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <h3 className="mb-2 font-medium">Luu y khi dang tin</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>- Chup anh ro rang, dung tinh trang san pham</li>
                  <li>- Mo ta trung thuc</li>
                  <li>- Bai dang se duoc admin duyet</li>
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                Huy
              </Button>
              <Button type="submit" className="flex-1 gap-2" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Dang dang...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Dang tin
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
