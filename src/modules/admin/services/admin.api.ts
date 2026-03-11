import { apiRequest, toQueryString, type ApiQueryValue } from '@/core/api/http'
import { mapPaginatedProducts, mapPaginatedReports } from '@/core/api/mappers'

export const adminApi = {
  pendingListings(query?: Record<string, ApiQueryValue>) {
    return apiRequest<unknown>(`/admin/listings/pending${toQueryString(query)}`).then(mapPaginatedProducts)
  },
  approveListing(id: string) {
    return apiRequest<{ message: string }>(`/admin/listings/${id}/approve`, { method: 'POST' })
  },
  rejectListing(id: string) {
    return apiRequest<{ message: string }>(`/admin/listings/${id}/reject`, { method: 'POST' })
  },
  reports(query?: Record<string, ApiQueryValue>) {
    return apiRequest<unknown>(`/admin/reports${toQueryString(query)}`).then(mapPaginatedReports)
  },
  resolveReport(id: string) {
    return apiRequest<{ message: string }>(`/admin/reports/${id}/resolve`, { method: 'POST' })
  },
  dismissReport(id: string) {
    return apiRequest<{ message: string }>(`/admin/reports/${id}/dismiss`, { method: 'POST' })
  },
}
