'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ImagePlus, Info, Loader2, Sparkles, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { categoriesApi, listingsApi, uploadsApi } from '@/lib/api'
import { categoryLabels, conditionLabels, departmentLabels, type UploadedImage } from '@/lib/types'
import type { Category, Condition, Department } from '@/lib/types'
import { useAuth } from '@/providers/auth-provider'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'

const MAX_IMAGE_COUNT = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export default function CreatePostPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
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

    void run()
  }, [router, user])

  const validateFiles = (files: File[]) => {
    if (files.length === 0) {
      return { valid: false, message: 'Khong co file nao duoc chon' }
    }

    if (images.length + files.length > MAX_IMAGE_COUNT) {
      return { valid: false, message: `Toi da ${MAX_IMAGE_COUNT} anh` }
    }

    const invalidType = files.find((file) => !ALLOWED_IMAGE_TYPES.has(file.type))
    if (invalidType) {
      return { valid: false, message: 'Chi chap nhan JPG, PNG, WEBP' }
    }

    const oversize = files.find((file) => file.size > MAX_IMAGE_SIZE)
    if (oversize) {
      return { valid: false, message: 'Moi anh toi da 5MB' }
    }

    return { valid: true, message: '' }
  }

  const uploadFiles = async (files: File[]) => {
    const validation = validateFiles(files)
    if (!validation.valid) {
      toast.error(validation.message)
      return
    }

    setIsUploading(true)
    try {
      const response = await uploadsApi.uploadImages(files)
      setImages((prev) => [...prev, ...response.data])
      toast.success(`Da tai len ${response.data.length} anh`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong tai anh len duoc')
    } finally {
      setIsUploading(false)
    }
  }

  const handlePickFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (!fileList) {
      return
    }
    const files = Array.from(fileList)
    void uploadFiles(files)
    event.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

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
        images: images.map((image) => ({ url: image.url, publicId: image.publicId })),
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
    () => (categories.length ? categories : Object.entries(categoryLabels).map(([key, name]) => ({ key, name }))),
    [categories],
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.12),_transparent_24%),linear-gradient(180deg,_rgba(250,250,249,1)_0%,_rgba(244,244,245,1)_100%)]">
      <Header />

      <main className="py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Link href="/marketplace">
                <Button variant="outline" size="icon" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Dang tin moi</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tao bai dang ro rang, it buoc va du thong tin de nguoi mua chot nhanh hon.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="border-border/70 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Hinh anh san pham</CardTitle>
                  <CardDescription>Tai len toi da 5 anh. Anh dau tien se la anh bia cua bai dang.</CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handlePickFiles}
                  />

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {images.map((image, index) => (
                      <div key={`${image.publicId}-${index}`} className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
                        <Image src={image.url} alt={`Anh san pham ${index + 1}`} fill className="object-cover" />
                        {index === 0 ? (
                          <div className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                            Anh bia
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    {images.length < MAX_IMAGE_COUNT ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(event) => {
                          event.preventDefault()
                          setDragOver(true)
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(event) => {
                          event.preventDefault()
                          setDragOver(false)
                          const droppedFiles = Array.from(event.dataTransfer.files)
                          void uploadFiles(droppedFiles)
                        }}
                        disabled={isUploading}
                        className={cn(
                          'flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors',
                          dragOver
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-background hover:border-primary/50 hover:bg-muted/50',
                          isUploading && 'cursor-not-allowed opacity-60',
                        )}
                      >
                        {isUploading ? (
                          <Loader2 className="mb-2 h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                          <ImagePlus className="mb-2 h-6 w-6 text-muted-foreground" />
                        )}
                        <span className="text-xs font-medium text-muted-foreground">
                          {isUploading ? 'Dang tai...' : 'Them anh'}
                        </span>
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5" />
                    Chi chap nhan JPG/PNG/WEBP, moi anh toi da 5MB.
                  </p>
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
                      placeholder="VD: Giao trinh Kinh te Vi mo - gan nhu moi"
                      value={formData.title}
                      onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                      required
                      maxLength={150}
                      className="h-11 rounded-xl"
                    />
                    <p className="text-right text-xs text-muted-foreground">{formData.title.length}/150</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Mo ta chi tiet</Label>
                    <Textarea
                      id="description"
                      placeholder="Mo ta tinh trang, thoi gian da dung, ly do ban, noi co the xem hang..."
                      value={formData.description}
                      onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                      required
                      rows={6}
                      maxLength={2000}
                      className="rounded-2xl"
                    />
                    <p className="text-right text-xs text-muted-foreground">{formData.description.length}/2000</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="price">Gia ban (VND)</Label>
                      <Input
                        id="price"
                        placeholder="0"
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
                        placeholder="Khong bat buoc"
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
                        onValueChange={(value) => setFormData({ ...formData, category: value as Category })}
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
                        onValueChange={(value) => setFormData({ ...formData, condition: value as Condition })}
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
                      onValueChange={(value) => setFormData({ ...formData, department: value as Department })}
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
                <Button type="submit" className="h-11 flex-1 gap-2 rounded-full" disabled={isLoading || isUploading}>
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

            <div className="space-y-4">
              <Card className="border-border/70 bg-zinc-950 text-white shadow-xl shadow-zinc-950/10">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <Sparkles className="h-5 w-5 text-emerald-300" />
                  </div>
                  <h2 className="text-xl font-semibold">Bai dang tot thuong co gi?</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
                    <li>- Anh ro, du sang va chup dung mon do.</li>
                    <li>- Tieu de co ten san pham, tinh trang va diem noi bat.</li>
                    <li>- Mo ta trung thuc de giam hoi di hoi lai trong chat.</li>
                    <li>- Gia ro rang giup nguoi mua quyet dinh nhanh hon.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-medium">Luu y khi dang tin</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>- Bai dang se di qua buoc duyet truoc khi hien thi cong khai.</li>
                    <li>- Tranh dung tieu de mo hoac anh khong lien quan.</li>
                    <li>- Co the chinh sua lai sau khi dang neu can cap nhat thong tin.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
