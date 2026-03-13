import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/core/query/keys'
import { statsApi } from './stats.api'

export const usePublicStatsQuery = () =>
  useQuery({
    queryKey: queryKeys.stats.public(),
    queryFn: () => statsApi.public(),
    staleTime: 60_000,
  })
