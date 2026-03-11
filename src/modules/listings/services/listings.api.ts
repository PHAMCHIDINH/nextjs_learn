import type { ProductStatus } from '@/lib/types'
import { apiRequest, toQueryString, type ApiQueryValue } from '@/core/api/http'
import { mapPaginatedProducts, mapProduct } from '@/core/api/mappers'

type ListingImagePayload = string | { url: string; publicId?: string }

type ListingWritePayload = {
  title: string
  description: string
  price: number
  originalPrice?: number
  category: string
  condition: string
  department?: string
  images?: ListingImagePayload[]
}

type ListingUpdatePayload = Partial<{
  title: string
  description: string
  price: number
  originalPrice: number
  category: string
  condition: string
  department: string
  status: ProductStatus
  images: ListingImagePayload[]
}>

export const listingsApi = {
  list(query?: Record<string, ApiQueryValue>) {
    return apiRequest<unknown>(`/listings${toQueryString(query)}`).then(mapPaginatedProducts)
  },
  byId(id: string) {
    return apiRequest<unknown>(`/listings/${id}`).then(mapProduct)
  },
  bySeller(sellerId: string, query?: Record<string, ApiQueryValue>) {
    return apiRequest<unknown>(`/listings/seller/${sellerId}${toQueryString(query)}`).then(mapPaginatedProducts)
  },
  create(payload: ListingWritePayload) {
    return apiRequest<unknown>('/listings', {
      method: 'POST',
      json: payload,
    }).then(mapProduct)
  },
  update(id: string, payload: ListingUpdatePayload) {
    return apiRequest<unknown>(`/listings/${id}`, {
      method: 'PATCH',
      json: payload,
    }).then(mapProduct)
  },
  remove(id: string) {
    return apiRequest<{ message: string }>(`/listings/${id}`, {
      method: 'DELETE',
    })
  },
  updateStatus(id: string, status: ProductStatus) {
    return apiRequest<unknown>(`/listings/${id}/status`, {
      method: 'PATCH',
      json: { status },
    }).then(mapProduct)
  },
  save(id: string) {
    return apiRequest<{ saved: boolean }>(`/listings/${id}/save`, {
      method: 'POST',
    })
  },
  unsave(id: string) {
    return apiRequest<{ saved: boolean }>(`/listings/${id}/save`, {
      method: 'DELETE',
    })
  },
}
