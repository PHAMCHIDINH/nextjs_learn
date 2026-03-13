'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles, Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { listingsApi } from '@/lib/api'
import { toListingWritePayload } from '@/lib/validation/adapters'
import {
  listingFormSchema,
  type ListingFormSchemaInputValues,
  type ListingFormSchemaValues,
} from '@/lib/validation/schemas'
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
  const form = useForm<ListingFormSchemaInputValues, unknown, ListingFormSchemaValues>({
    resolver: zodResolver(listingFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      price: '',
      originalPrice: '',
      category: '',
      condition: '',
      department: '',
    },
  })
  const {
    images,
    isUploading,
    dragOver,
    uploadError,
    setDragOver,
    setUploadError,
    uploadFiles,
    handlePickFiles,
    removeImage,
    formatCurrency,
  } = useListingEditor({})

  const formData = form.watch()

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

    form.setValue('department', user.department)
  }, [form, user])

  useEffect(() => {
    if (images.length > 0 && uploadError) {
      setUploadError(null)
    }
  }, [images.length, setUploadError, uploadError])

  const handleSubmit = form.handleSubmit(async (values) => {
    if (images.length === 0) {
      setUploadError('Vui lòng tải lên ít nhất 1 ảnh')
      return
    }

    if (!user) {
      router.push('/auth?mode=login')
      return
    }

    setUploadError(null)
    setIsLoading(true)
    try {
      await listingsApi.create(toListingWritePayload(values, images))

      toast.success('Đăng tin thành công, bài đăng đang chờ duyệt')
      router.push('/dashboard?tab=posts')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không đăng tin được')
    } finally {
      setIsLoading(false)
    }
  })

  return (
    <AppShell
      title="Đăng tin mới"
      description="Tạo bài đăng rõ ràng, ít bước và đủ thông tin để người mua chốt nhanh hơn."
      breadcrumbs={[
        { label: 'Marketplace', href: '/marketplace' },
        { label: 'Đăng tin mới' },
      ]}
      contentClassName="max-w-none px-0 py-0"
    >
      <div className="bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.12),_transparent_24%),linear-gradient(180deg,_rgba(250,250,249,1)_0%,_rgba(244,244,245,1)_100%)]">
        <ListingEditorPageShell backHref="/marketplace">
          <ListingEditorForm
            imageTitle="Hình ảnh sản phẩm"
            imageDescription="Tải lên tối đa 5 ảnh. Ảnh đầu tiên sẽ là ảnh bìa của bài đăng."
            submitLabel="Đăng tin"
            submitPendingLabel="Đang đăng..."
            submitIcon={Upload}
            formData={formData}
            control={form.control}
            register={form.register}
            setValue={form.setValue}
            trigger={form.trigger}
            errors={form.formState.errors}
            touchedFields={form.formState.touchedFields}
            submitCount={form.formState.submitCount}
            images={images}
            imageError={uploadError}
            categories={categories}
            dragOver={dragOver}
            isUploading={isUploading}
            isSubmitting={isLoading}
            fileInputRef={fileInputRef}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            onDragOverChange={setDragOver}
            onPickFiles={handlePickFiles}
            onUploadFiles={uploadFiles}
            onRemoveImage={removeImage}
            formatCurrency={formatCurrency}
            sidebar={
              <>
                <Card className="border-border/70 bg-zinc-950 text-white shadow-xl shadow-zinc-950/10">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                      <Sparkles className="h-5 w-5 text-emerald-300" />
                    </div>
                    <h2 className="text-xl font-semibold">Bài đăng tốt thường có gì?</h2>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
                      <li>- Ảnh rõ, đủ sáng và chụp đúng món đồ.</li>
                      <li>- Tiêu đề có tên sản phẩm, tình trạng và điểm nổi bật.</li>
                      <li>- Mô tả trung thực để giảm hỏi đi hỏi lại trong chat.</li>
                      <li>- Giá rõ ràng giúp người mua quyết định nhanh hơn.</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5 shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="font-medium">Lưu ý khi đăng tin</h3>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>- Bài đăng sẽ đi qua bước duyệt trước khi hiển thị công khai.</li>
                      <li>- Tránh dùng tiêu đề mơ hồ hoặc ảnh không liên quan.</li>
                      <li>- Có thể chỉnh sửa lại sau khi đăng nếu cần cập nhật thông tin.</li>
                    </ul>
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
