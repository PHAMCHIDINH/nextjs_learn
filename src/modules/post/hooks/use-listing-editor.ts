'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { categoriesApi, uploadsApi } from '@/lib/api'
import { categoryLabels } from '@/lib/types'
import { listingUploadFilesSchema, MAX_LISTING_IMAGE_COUNT } from '@/lib/validation/schemas'
import type { ListingFormSchemaInputValues } from '@/lib/validation/schemas'

export type EditableListingImage = {
  url: string
  publicId?: string
}

export type ListingFormValues = ListingFormSchemaInputValues

export type ListingCategoryOption = {
  key: string
  name: string
}

export const getDefaultListingCategories = (): ListingCategoryOption[] =>
  Object.entries(categoryLabels).map(([key, name]) => ({ key, name }))

export const loadListingCategories = async (): Promise<ListingCategoryOption[]> => {
  try {
    const items = await categoriesApi.list()
    return items.map((item) => ({ key: item.key, name: item.name }))
  } catch {
    return getDefaultListingCategories()
  }
}

export const useListingEditor = ({
  initialImages = [],
}: {
  initialImages?: EditableListingImage[]
}) => {
  const [images, setImages] = useState<EditableListingImage[]>(initialImages)
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const validateFiles = useCallback(
    (files: File[]) => {
      const imageCap = MAX_LISTING_IMAGE_COUNT - images.length
      if (imageCap <= 0) {
        return { valid: false, message: `Tối đa ${MAX_LISTING_IMAGE_COUNT} ảnh` }
      }

      if (files.length > imageCap) {
        return { valid: false, message: `Tối đa ${MAX_LISTING_IMAGE_COUNT} ảnh` }
      }

      const selectedFiles = files.slice(0, imageCap)
      const parsed = listingUploadFilesSchema.safeParse(selectedFiles)
      if (!parsed.success) {
        return { valid: false, message: parsed.error.issues[0]?.message ?? 'Tệp tải lên không hợp lệ' }
      }

      return { valid: true, message: '', files: selectedFiles }
    },
    [images.length],
  )

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const validation = validateFiles(files)
      if (!validation.valid || !validation.files) {
        setUploadError(validation.message)
        return false
      }

      setUploadError(null)
      setIsUploading(true)
      try {
        const response = await uploadsApi.uploadImages(validation.files)
        setImages((previous) => [
          ...previous,
          ...response.data.map((image) => ({
            url: image.url,
            publicId: image.publicId,
          })),
        ])
        toast.success(`Đã tải lên ${response.data.length} ảnh`)
        return true
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Không tải ảnh lên được')
        return false
      } finally {
        setIsUploading(false)
      }
    },
    [validateFiles],
  )

  const handlePickFiles = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files
      if (!fileList) {
        return
      }

      void uploadFiles(Array.from(fileList))
      event.target.value = ''
    },
    [uploadFiles],
  )

  const removeImage = useCallback((index: number) => {
    setImages((previous) => previous.filter((_, imageIndex) => imageIndex !== index))
    setUploadError(null)
  }, [])

  const formatCurrency = useCallback((value: string) => {
    const number = value.replace(/\D/g, '')
    return number ? new Intl.NumberFormat('vi-VN').format(Number.parseInt(number, 10)) : ''
  }, [])

  const reset = useCallback(
    ({
      nextImages,
    }: {
      nextImages?: EditableListingImage[]
    }) => {
      setImages(nextImages ?? [])
      setDragOver(false)
      setUploadError(null)
    },
    [],
  )

  return {
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
    reset,
  }
}
