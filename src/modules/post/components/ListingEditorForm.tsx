'use client'

import type { RefObject, ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, ImagePlus, Info, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { conditionLabels, departmentLabels, type Category, type Condition, type Department } from '@/lib/types'
import type { EditableListingImage, ListingCategoryOption, ListingFormValues } from '../hooks/use-listing-editor'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'

type ListingEditorFormProps = {
  imageTitle: string
  imageDescription: string
  submitLabel: string
  submitPendingLabel: string
  submitIcon: LucideIcon
  formData: ListingFormValues
  images: EditableListingImage[]
  categories: ListingCategoryOption[]
  dragOver: boolean
  isUploading: boolean
  isSubmitting: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onSubmit: (event: React.FormEvent) => void
  onCancel: () => void
  onFormDataChange: (updater: (previous: ListingFormValues) => ListingFormValues) => void
  onDragOverChange: (value: boolean) => void
  onPickFiles: (event: React.ChangeEvent<HTMLInputElement>) => void
  onUploadFiles: (files: File[]) => Promise<void>
  onRemoveImage: (index: number) => void
  onPriceChange: (field: 'price' | 'originalPrice', value: string) => void
  formatCurrency: (value: string) => string
  sidebar: ReactNode
}

export function ListingEditorForm({
  imageTitle,
  imageDescription,
  submitLabel,
  submitPendingLabel,
  submitIcon: SubmitIcon,
  formData,
  images,
  categories,
  dragOver,
  isUploading,
  isSubmitting,
  fileInputRef,
  onSubmit,
  onCancel,
  onFormDataChange,
  onDragOverChange,
  onPickFiles,
  onUploadFiles,
  onRemoveImage,
  onPriceChange,
  formatCurrency,
  sidebar,
}: ListingEditorFormProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form onSubmit={onSubmit} className="space-y-6">
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
                  <Image src={image.url} alt={`Anh san pham ${index + 1}`} fill className="object-cover" />
                  {index === 0 ? (
                    <div className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                      Anh bia
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
                onChange={(event) =>
                  onFormDataChange((previous) => ({ ...previous, title: event.target.value }))
                }
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
                onChange={(event) =>
                  onFormDataChange((previous) => ({ ...previous, description: event.target.value }))
                }
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
                  onChange={(event) => onPriceChange('price', event.target.value)}
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
                  onChange={(event) => onPriceChange('originalPrice', event.target.value)}
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
                  onValueChange={(value) =>
                    onFormDataChange((previous) => ({ ...previous, category: value as Category }))
                  }
                  required
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Chon danh muc" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
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
                  onValueChange={(value) =>
                    onFormDataChange((previous) => ({ ...previous, condition: value as Condition }))
                  }
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
                onValueChange={(value) =>
                  onFormDataChange((previous) => ({ ...previous, department: value as Department }))
                }
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
          <Button type="button" variant="outline" className="h-11 flex-1 rounded-full" onClick={onCancel}>
            Huy
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
  pageTitle: string
  pageDescription: string
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
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{pageTitle}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{pageDescription}</p>
            </div>
          </div>
        </div>

        {children}
      </div>
    </main>
  )
}
