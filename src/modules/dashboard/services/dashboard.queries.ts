import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/core/query/keys'
import { dashboardApi } from './dashboard.api'

export const useDashboardSummaryQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: () => dashboardApi.summary(),
    enabled,
  })
