import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import type { ApiQueryValue } from '@/core/api/http'
import type { ProductStatus } from '@/lib/types'
import { queryKeys } from '@/core/query/keys'
import { listingsApi } from './listings.api'

type ListingQueryParams = Record<string, ApiQueryValue>

export const useListingsInfiniteQuery = ({
  params,
  pageSize,
  enabled = true,
}: {
  params: ListingQueryParams
  pageSize: number
  enabled?: boolean
}) =>
  useInfiniteQuery({
    queryKey: queryKeys.listings.list({ ...params, limit: pageSize }),
    queryFn: ({ pageParam }) =>
      listingsApi.list({
        ...params,
        page: pageParam,
        limit: pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    enabled,
  })

export const useListingDetailQuery = (id: string) =>
  useQuery({
    queryKey: queryKeys.listings.byId(id),
    queryFn: () => listingsApi.byId(id),
    enabled: Boolean(id),
  })

export const useListingsQuery = ({
  params,
  enabled = true,
}: {
  params: ListingQueryParams
  enabled?: boolean
}) =>
  useQuery({
    queryKey: queryKeys.listings.list(params),
    queryFn: () => listingsApi.list(params),
    enabled,
  })

export const useRelatedListingsQuery = ({
  category,
  exceptListingId,
  limit = 8,
}: {
  category?: string
  exceptListingId?: string
  limit?: number
}) =>
  useQuery({
    queryKey: queryKeys.listings.list({ category, limit, sortBy: 'newest' }),
    queryFn: () => listingsApi.list({ category, limit, sortBy: 'newest' }),
    enabled: Boolean(category),
    select: (result) => result.data.filter((item) => item.id !== exceptListingId).slice(0, 4),
  })

export const useSaveListingMutation = () =>
  useMutation({
    mutationFn: (id: string) => listingsApi.save(id),
  })

export const useUnsaveListingMutation = () =>
  useMutation({
    mutationFn: (id: string) => listingsApi.unsave(id),
  })

export const useRemoveListingMutation = () =>
  useMutation({
    mutationFn: (id: string) => listingsApi.remove(id),
  })

export const useUpdateListingStatusMutation = () =>
  useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) =>
      listingsApi.updateStatus(id, status),
  })
