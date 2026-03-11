import type { Department } from '@/lib/types'
import { apiRequest, toQueryString, type ApiQueryValue } from '@/core/api/http'
import { mapPaginatedProducts, mapPublicUserProfile, mapUser } from '@/core/api/mappers'

type UserAvatarPayload =
  | {
      url: string
      publicId?: string
    }
  | null

type UserUpdatePayload = Partial<{
  name: string
  department: Department
  avatar: UserAvatarPayload
}>

export const usersApi = {
  list() {
    return apiRequest<unknown[]>('/users').then((items) => items.map(mapUser))
  },
  getPublicProfile(id: string) {
    return apiRequest<unknown>(`/users/${id}`, { auth: false }).then(mapPublicUserProfile)
  },
  me() {
    return apiRequest<unknown>('/users/me').then(mapUser)
  },
  updateMe(payload: UserUpdatePayload) {
    return apiRequest<unknown>('/users/me', {
      method: 'PATCH',
      json: payload,
    }).then(mapUser)
  },
  myListings(query?: Record<string, ApiQueryValue>) {
    return apiRequest<unknown>(`/users/me/listings${toQueryString(query)}`).then(mapPaginatedProducts)
  },
  mySavedListings(query?: Record<string, ApiQueryValue>) {
    return apiRequest<unknown>(`/users/me/saved-listings${toQueryString(query)}`).then(mapPaginatedProducts)
  },
  publicListings(id: string, query?: Record<string, ApiQueryValue>) {
    return apiRequest<unknown>(`/users/${id}/listings${toQueryString(query)}`, { auth: false }).then(mapPaginatedProducts)
  },
  blockUser(id: string) {
    return apiRequest<{ blocked: boolean }>(`/users/${id}/block`, { method: 'POST' })
  },
  unblockUser(id: string) {
    return apiRequest<{ blocked: boolean }>(`/users/${id}/block`, { method: 'DELETE' })
  },
}
