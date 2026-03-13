import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/core/query/keys'
import { authApi } from './auth.api'

export const useAuthMeQuery = () =>
  useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authApi.me,
    retry: false,
    staleTime: 60_000,
  })
