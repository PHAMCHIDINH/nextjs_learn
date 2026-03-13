'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Info, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
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
          toast.error('Bạn không có quyền sửa bài đăng này')
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
        toast.error(error instanceof Error ? error.message : 'Không tải dữ liệu bài đăng được')
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
      toast.error('Vui lòng nhập đầy đủ thông tin bắt buộc')
      return
    }

    if (images.length === 0) {
      toast.error('Vui lòng giữ lại ít nhất 1 ảnh cho bài đăng')
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
      toast.success('Cập nhật bài đăng thành công')
      router.push('/dashboard?tab=posts')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không cập nhật bài đăng được')
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
      <AppShell
        title="Sửa bài đăng"
        description="Cập nhật thông tin bài đăng của bạn."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard?tab=posts' },
          { label: 'Bài đăng của tôi', href: '/dashboard?tab=posts' },
          { label: 'Sửa bài đăng' },
        ]}
      >
        <div className="flex min-h-[320px] items-center justify-center">
          <Link href="/dashboard?tab=posts">
            <Button variant="outline">Quay lại dashboard</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Sửa bài đăng"
      description="Cập nhật thông tin bài đăng của bạn."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard?tab=posts' },
        { label: 'Bài đăng của tôi', href: '/dashboard?tab=posts' },
        { label: 'Sửa bài đăng' },
      ]}
      contentClassName="max-w-none px-0 py-0"
    >
      <div className="bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.12),_transparent_24%),linear-gradient(180deg,_rgba(250,250,249,1)_0%,_rgba(244,244,245,1)_100%)]">
        <ListingEditorPageShell backHref="/dashboard?tab=posts">
          <ListingEditorForm
            imageTitle="Hình ảnh bài đăng"
            imageDescription="Thêm, xóa và sắp xếp lại bộ ảnh trước khi lưu thay đổi."
            submitLabel="Lưu thay đổi"
            submitPendingLabel="Đang lưu..."
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
                    <h3 className="font-medium">Lưu ý</h3>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>- Bài đăng sửa xong vẫn theo trạng thái kiểm duyệt hiện tại.</li>
                      <li>- Ảnh đầu tiên sẽ được dùng làm ảnh bìa.</li>
                      <li>- Bạn có thể đổi trạng thái bán ngay trong Dashboard.</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border/70 bg-white/90 shadow-sm">
                  <CardContent className="p-5">
                    <p className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      Có thể thay đổi thông tin và bộ ảnh trong cùng một lần cập nhật.
                    </p>
                  </CardContent>
                </Card>
              </>
            }
          />
        </ListingEditorPageShell>
      </div>
    </AppShell>
  )
}
