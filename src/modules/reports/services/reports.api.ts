import { apiRequest } from '@/core/api/http'

export const reportsApi = {
  create(payload: { listingId: string; reason: string }) {
    return apiRequest<{ id: string; status: string }>('/reports', {
      method: 'POST',
      json: payload,
    })
  },
}
