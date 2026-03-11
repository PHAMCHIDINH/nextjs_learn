import type { PublicStats } from '@/lib/types'
import { apiRequest } from '@/core/api/http'

export const statsApi = {
  public() {
    return apiRequest<PublicStats>('/stats/public', { auth: false })
  },
}
