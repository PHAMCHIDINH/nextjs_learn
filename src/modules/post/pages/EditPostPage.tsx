'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Info, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { listingsApi } from '@/lib/api'
import type { Product } from '@/lib/types'
import { useAuth } from '@/core/providers/auth-provider'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { ListingEditorForm, ListingEditorPageShell } from '../components/ListingEditorForm'
import {
  getDefaultListingCategories,
  loadListingCategories,
  useListingEditor,
} from '../hooks/use-listing-editor'

type EditPostPageProps = {
  params: Promise<{ id: string }>
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { user, loading: authLoading } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState(getDefaultListingCategories())
  const {
    formData,
    setFormData,
    images,
    isUploading,
    dragOver,
    setDragOver,
    uploadFiles,
    handlePickFiles,
    removeImage,
    formatCurrency,
    handlePriceChange,
    reset,
  } = useListingEditor({
    initialValues: {
      title: '',
      description: '',
      price: '',
      originalPrice: '',
      category: '',
      condition: '',
      department: '',
    },
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
        const [categoryOptions, detail] = await Promise.all([
          loadListingCategories(),
          listingsApi.byId(id),
        ])

        setCategories(categoryOptions)
        setProduct(detail)

        if (detail.seller.id !== user.id && user.role !== 'admin') {
          toast.error('Ban khong co quyen sua bai dang nay')
          router.replace('/dashboard?tab=posts')
          return
        }

        reset({
          nextValues: {
            title: detail.title,
            description: detail.description,
            price: String(detail.price),
            originalPrice: detail.originalPrice ? String(detail.originalPrice) : '',
            category: detail.category,
            condition: detail.condition,
            department: detail.department,
          },
          nextImages: detail.images.map((url) => ({ url })),
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Khong tai du lieu bai dang duoc')
        router.replace('/dashboard?tab=posts')
      } finally {
        setLoadingData(false)
      }
    }

    void run()
  }, [authLoading, id, reset, router, user])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!product) {
      return
    }

    if (!formData.category || !formData.condition || !formData.department) {
      toast.error('Vui long nhap day du thong tin bat buoc')
      return
    }

    if (images.length === 0) {
      toast.error('Vui long giu lai it nhat 1 anh cho bai dang')
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
        images: images.map((image) => ({
          url: image.url,
          publicId: image.publicId,
        })),
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

      <ListingEditorPageShell
        backHref="/dashboard?tab=posts"
        pageTitle="Sua bai dang"
        pageDescription="Cap nhat thong tin bai dang cua ban."
      >
        <ListingEditorForm
          imageTitle="Hinh anh bai dang"
          imageDescription="Them, xoa va sap xep lai bo anh truoc khi luu thay doi."
          submitLabel="Luu thay doi"
          submitPendingLabel="Dang luu..."
          submitIcon={Save}
          formData={formData}
          images={images}
          categories={categories}
          dragOver={dragOver}
          isUploading={isUploading}
          isSubmitting={isSaving}
          fileInputRef={fileInputRef}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          onFormDataChange={setFormData}
          onDragOverChange={setDragOver}
          onPickFiles={handlePickFiles}
          onUploadFiles={uploadFiles}
          onRemoveImage={removeImage}
          onPriceChange={handlePriceChange}
          formatCurrency={formatCurrency}
          sidebar={
            <>
              <Card className="border-primary/20 bg-primary/5 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-medium">Luu y</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>- Bai dang sua xong van theo trang thai kiem duyet hien tai.</li>
                    <li>- Anh dau tien se duoc dung lam anh bia.</li>
                    <li>- Ban co the doi trang thai ban ngay trong Dashboard.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-white/90 shadow-sm">
                <CardContent className="p-5">
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    Co the thay doi thong tin va bo anh trong cung mot lan cap nhat.
                  </p>
                </CardContent>
              </Card>
            </>
          }
        />
      </ListingEditorPageShell>
    </div>
  )
}
