import type { Department } from '@/lib/types'
import type { EditableListingImage } from '@/modules/post/hooks/use-listing-editor'
import type { ListingFormSchemaValues } from './schemas'

export const toListingWritePayload = (
  values: ListingFormSchemaValues,
  images: EditableListingImage[],
) => ({
  title: values.title.trim(),
  description: values.description.trim(),
  price: Number(values.price),
  originalPrice: values.originalPrice ? Number(values.originalPrice) : undefined,
  category: values.category as Exclude<ListingFormSchemaValues['category'], ''>,
  condition: values.condition as Exclude<ListingFormSchemaValues['condition'], ''>,
  department: values.department as Exclude<ListingFormSchemaValues['department'], ''>,
  images: images.map((image) => ({ url: image.url, publicId: image.publicId })),
})

export const toProfileUpdatePayload = ({
  currentName,
  currentDepartment,
  nextName,
  nextDepartment,
}: {
  currentName: string
  currentDepartment: Department
  nextName: string
  nextDepartment: Department
}) => {
  const payload: {
    name?: string
    department?: Department
  } = {}

  if (nextName.trim() !== currentName) {
    payload.name = nextName.trim()
  }

  if (nextDepartment !== currentDepartment) {
    payload.department = nextDepartment
  }

  return payload
}
