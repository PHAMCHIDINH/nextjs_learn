'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { listingsApi } from '@/lib/api'
import type { Category, Condition, Department } from '@/lib/types'
import { useAuth } from '@/core/providers/auth-provider'
import { Card, CardContent } from '@/shared/ui/card'
import { ListingEditorForm, ListingEditorPageShell } from '../components/ListingEditorForm'
import {
  getDefaultListingCategories,
  loadListingCategories,
  useListingEditor,
} from '../hooks/use-listing-editor'

export default function CreatePostPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
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
  } = useListingEditor({
    initialValues: {
      title: '',
      description: '',
      price: '',
      originalPrice: '',
      category: '' as Category | '',
      condition: '' as Condition | '',
      department: '' as Department | '',
    },
  })

  useEffect(() => {
    if (!user) {
      router.replace('/auth?mode=login')
      return
    }

    void loadListingCategories().then(setCategories)
  }, [router, user])

  useEffect(() => {
    if (!user?.department) {
      return
    }

    setFormData((previous) =>
      previous.department ? previous : { ...previous, department: user.department },
    )
  }, [setFormData, user])

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.12),_transparent_24%),linear-gradient(180deg,_rgba(250,250,249,1)_0%,_rgba(244,244,245,1)_100%)]">
      <Header />

      <ListingEditorPageShell
        backHref="/marketplace"
        pageTitle="Dang tin moi"
        pageDescription="Tao bai dang ro rang, it buoc va du thong tin de nguoi mua chot nhanh hon."
      >
        <ListingEditorForm
          imageTitle="Hinh anh san pham"
          imageDescription="Tai len toi da 5 anh. Anh dau tien se la anh bia cua bai dang."
          submitLabel="Dang tin"
          submitPendingLabel="Dang dang..."
          submitIcon={Upload}
          formData={formData}
          images={images}
          categories={categories}
          dragOver={dragOver}
          isUploading={isUploading}
          isSubmitting={isLoading}
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
            </>
          }
        />
      </ListingEditorPageShell>
    </div>
  )
}
