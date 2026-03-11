import type { DashboardSummary } from '@/lib/types'
import { apiRequest } from '@/core/api/http'

export const dashboardApi = {
  summary() {
    return apiRequest<DashboardSummary>('/dashboard/summary')
  },
}
