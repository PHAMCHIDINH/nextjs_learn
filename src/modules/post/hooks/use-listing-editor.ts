'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { categoriesApi, uploadsApi } from '@/lib/api'
import {
  categoryLabels,
  type Category,
  type Condition,
  type Department,
} from '@/lib/types'

export type EditableListingImage = {
  url: string
  publicId?: string
}

export type ListingFormValues = {
  title: string
  description: string
  price: string
  originalPrice: string
  category: Category | ''
  condition: Condition | ''
  department: Department | ''
}

export type ListingCategoryOption = {
  key: string
  name: string
}

const MAX_IMAGE_COUNT = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

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
  initialValues,
  initialImages = [],
}: {
  initialValues: ListingFormValues
  initialImages?: EditableListingImage[]
}) => {
  const [formData, setFormData] = useState<ListingFormValues>(initialValues)
  const [images, setImages] = useState<EditableListingImage[]>(initialImages)
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const validateFiles = useCallback(
    (files: File[]) => {
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
    },
    [images.length],
  )

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const validation = validateFiles(files)
      if (!validation.valid) {
        toast.error(validation.message)
        return
      }

      setIsUploading(true)
      try {
        const response = await uploadsApi.uploadImages(files)
        setImages((previous) => [
          ...previous,
          ...response.data.map((image) => ({
            url: image.url,
            publicId: image.publicId,
          })),
        ])
        toast.success(`Da tai len ${response.data.length} anh`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Khong tai anh len duoc')
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
  }, [])

  const formatCurrency = useCallback((value: string) => {
    const number = value.replace(/\D/g, '')
    return number ? new Intl.NumberFormat('vi-VN').format(Number.parseInt(number, 10)) : ''
  }, [])

  const handlePriceChange = useCallback((field: 'price' | 'originalPrice', value: string) => {
    const rawValue = value.replace(/\D/g, '')
    setFormData((previous) => ({ ...previous, [field]: rawValue }))
  }, [])

  const reset = useCallback(
    ({
      nextValues,
      nextImages,
    }: {
      nextValues: ListingFormValues
      nextImages?: EditableListingImage[]
    }) => {
      setFormData(nextValues)
      setImages(nextImages ?? [])
      setDragOver(false)
    },
    [],
  )

  return {
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
  }
}
