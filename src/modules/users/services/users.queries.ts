import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import type { ApiQueryValue } from '@/core/api/http'
import { queryKeys } from '@/core/query/keys'
import { usersApi } from './users.api'

type UserQueryParams = Record<string, ApiQueryValue>

export const useUsersListQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: () => usersApi.list(),
    enabled,
  })

export const usePublicUserProfileQuery = (id: string) =>
  useQuery({
    queryKey: queryKeys.users.profile(id),
    queryFn: () => usersApi.getPublicProfile(id),
    enabled: Boolean(id),
  })

export const usePublicUserListingsInfiniteQuery = ({
  id,
  params,
  pageSize,
  enabled = true,
}: {
  id: string
  params: UserQueryParams
  pageSize: number
  enabled?: boolean
}) =>
  useInfiniteQuery({
    queryKey: queryKeys.users.publicListings(id, { ...params, limit: pageSize }),
    queryFn: ({ pageParam }) =>
      usersApi.publicListings(id, {
        ...params,
        page: pageParam,
        limit: pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    enabled: Boolean(id) && enabled,
  })

export const useMyListingsQuery = ({
  params,
  enabled = true,
}: {
  params: UserQueryParams
  enabled?: boolean
}) =>
  useQuery({
    queryKey: queryKeys.users.myListings(params),
    queryFn: () => usersApi.myListings(params),
    enabled,
  })

export const useMySavedListingsQuery = ({
  params,
  enabled = true,
}: {
  params: UserQueryParams
  enabled?: boolean
}) =>
  useQuery({
    queryKey: queryKeys.users.mySavedListings(params),
    queryFn: () => usersApi.mySavedListings(params),
    enabled,
  })

export const useUpdateMeMutation = () =>
  useMutation({
    mutationFn: usersApi.updateMe,
  })

export const useBlockUserMutation = () =>
  useMutation({
    mutationFn: (id: string) => usersApi.blockUser(id),
  })
