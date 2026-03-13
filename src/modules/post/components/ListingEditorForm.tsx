'use client'

import type { RefObject, ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, ImagePlus, Info, Loader2, X } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { conditionLabels, departmentLabels } from '@/lib/types'
import type { EditableListingImage, ListingCategoryOption, ListingFormValues } from '../hooks/use-listing-editor'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { FieldError } from '@/shared/ui/field-error'
import { FormFieldErrorMessage, RHFSelect, useFormFieldError } from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'

type ListingEditorFormProps = {
  imageTitle: string
  imageDescription: string
  submitLabel: string
  submitPendingLabel: string
  submitIcon: LucideIcon
  images: EditableListingImage[]
  imageError: string | null
  categories: ListingCategoryOption[]
  dragOver: boolean
  isUploading: boolean
  isSubmitting: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onSubmit: (event: React.FormEvent) => void
  onCancel: () => void
  onDragOverChange: (value: boolean) => void
  onPickFiles: (event: React.ChangeEvent<HTMLInputElement>) => void
  onUploadFiles: (files: File[]) => Promise<boolean>
  onRemoveImage: (index: number) => void
  formatCurrency: (value: string) => string
  sidebar: ReactNode
}

export function ListingEditorForm({
  imageTitle,
  imageDescription,
  submitLabel,
  submitPendingLabel,
  submitIcon: SubmitIcon,
  images,
  imageError,
  categories,
  dragOver,
  isUploading,
  isSubmitting,
  fileInputRef,
  onSubmit,
  onCancel,
  onDragOverChange,
  onPickFiles,
  onUploadFiles,
  onRemoveImage,
  formatCurrency,
  sidebar,
}: ListingEditorFormProps) {
  const form = useFormContext<ListingFormValues>()
  const title = form.watch('title')
  const description = form.watch('description')
  const titleError = useFormFieldError<ListingFormValues>('title')
  const descriptionError = useFormFieldError<ListingFormValues>('description')
  const priceError = useFormFieldError<ListingFormValues>('price')
  const originalPriceError = useFormFieldError<ListingFormValues>('originalPrice')

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <Card className="border-border/70 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{imageTitle}</CardTitle>
            <CardDescription>{imageDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={onPickFiles}
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {images.map((image, index) => (
                <div
                  key={`${image.publicId ?? image.url}-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted"
                >
                  <Image src={image.url} alt={`Ảnh sản phẩm ${index + 1}`} fill className="object-cover" />
                  {index === 0 ? (
                    <div className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                      Ảnh bìa
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {images.length < 5 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault()
                    onDragOverChange(true)
                  }}
                  onDragLeave={() => onDragOverChange(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    onDragOverChange(false)
                    void onUploadFiles(Array.from(event.dataTransfer.files))
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
                    {isUploading ? 'Đang tải...' : 'Thêm ảnh'}
                  </span>
                </button>
              ) : null}
            </div>

            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              Chỉ chấp nhận JPG/PNG/WEBP, mỗi ảnh tối đa 5MB.
            </p>
            <FieldError message={imageError ?? undefined} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề bài đăng</Label>
              <Input
                id="title"
                placeholder="VD: Giáo trình Kinh tế Vi mô - gần như mới"
                {...form.register('title')}
                maxLength={150}
                className="h-11 rounded-xl"
                aria-invalid={Boolean(titleError)}
              />
              <FormFieldErrorMessage<ListingFormValues> name="title" />
              <p className="text-right text-xs text-muted-foreground">{title.length}/150</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả chi tiết</Label>
              <Textarea
                id="description"
                placeholder="Mô tả tình trạng, thời gian đã dùng, lý do bán, nơi có thể xem hàng..."
                {...form.register('description')}
                rows={6}
                maxLength={2000}
                className="rounded-2xl"
                aria-invalid={Boolean(descriptionError)}
              />
              <FormFieldErrorMessage<ListingFormValues> name="description" />
              <p className="text-right text-xs text-muted-foreground">{description.length}/2000</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Giá bán (VND)</Label>
                <Controller
                  name="price"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="price"
                      placeholder="0"
                      value={formatCurrency(field.value)}
                      onChange={(event) => {
                        const rawValue = event.target.value.replace(/\D/g, '')
                        field.onChange(rawValue)
                      }}
                      onBlur={field.onBlur}
                      className="h-11 rounded-xl"
                      aria-invalid={Boolean(priceError)}
                    />
                  )}
                />
                <FormFieldErrorMessage<ListingFormValues> name="price" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Giá gốc (VND)</Label>
                <Controller
                  name="originalPrice"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="originalPrice"
                      placeholder="Không bắt buộc"
                      value={formatCurrency(field.value)}
                      onChange={(event) => {
                        const rawValue = event.target.value.replace(/\D/g, '')
                        field.onChange(rawValue)
                      }}
                      onBlur={field.onBlur}
                      className="h-11 rounded-xl"
                      aria-invalid={Boolean(originalPriceError)}
                    />
                  )}
                />
                <FormFieldErrorMessage<ListingFormValues> name="originalPrice" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Phân loại</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <RHFSelect<ListingFormValues>
                  name="category"
                  placeholder="Chọn danh mục"
                  triggerClassName="h-11 rounded-xl"
                  options={categories.map((item) => ({ value: item.key, label: item.name }))}
                />
                <FormFieldErrorMessage<ListingFormValues> name="category" />
              </div>

              <div className="space-y-2">
                <Label>Tình trạng</Label>
                <RHFSelect<ListingFormValues>
                  name="condition"
                  placeholder="Chọn tình trạng"
                  triggerClassName="h-11 rounded-xl"
                  options={Object.entries(conditionLabels).map(([key, label]) => ({ value: key, label }))}
                />
                <FormFieldErrorMessage<ListingFormValues> name="condition" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ngành học liên quan</Label>
              <RHFSelect<ListingFormValues>
                name="department"
                placeholder="Chọn ngành học"
                triggerClassName="h-11 rounded-xl"
                options={Object.entries(departmentLabels).map(([key, label]) => ({ value: key, label }))}
              />
              <FormFieldErrorMessage<ListingFormValues> name="department" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="h-11 flex-1 rounded-full" onClick={onCancel}>
            Hủy
          </Button>
          <Button type="submit" className="h-11 flex-1 gap-2 rounded-full" disabled={isSubmitting || isUploading}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {submitPendingLabel}
              </>
            ) : (
              <>
                <SubmitIcon className="h-4 w-4" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="space-y-4">{sidebar}</div>
    </div>
  )
}

export function ListingEditorPageShell({
  backHref,
  pageTitle,
  pageDescription,
  children,
}: {
  backHref: string
  pageTitle?: string
  pageDescription?: string
  children: ReactNode
}) {
  return (
    <main className="py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link href={backHref}>
              <Button variant="outline" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            {pageTitle || pageDescription ? (
              <div>
                {pageTitle ? <h1 className="text-3xl font-semibold tracking-tight">{pageTitle}</h1> : null}
                {pageDescription ? <p className="mt-2 text-sm text-muted-foreground">{pageDescription}</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        {children}
      </div>
    </main>
  )
}
