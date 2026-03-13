import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import type { ApiQueryValue } from '@/core/api/http'
import { queryKeys } from '@/core/query/keys'
import { adminApi } from './admin.api'

type AdminQueryParams = Record<string, ApiQueryValue>

export const usePendingListingsInfiniteQuery = ({
  params,
  pageSize,
  enabled = true,
}: {
  params: AdminQueryParams
  pageSize: number
  enabled?: boolean
}) =>
  useInfiniteQuery({
    queryKey: queryKeys.admin.pendingListings({ ...params, limit: pageSize }),
    queryFn: ({ pageParam }) =>
      adminApi.pendingListings({
        ...params,
        page: pageParam,
        limit: pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    enabled,
  })

export const useReportsInfiniteQuery = ({
  params,
  pageSize,
  enabled = true,
}: {
  params: AdminQueryParams
  pageSize: number
  enabled?: boolean
}) =>
  useInfiniteQuery({
    queryKey: queryKeys.admin.reports({ ...params, limit: pageSize }),
    queryFn: ({ pageParam }) =>
      adminApi.reports({
        ...params,
        page: pageParam,
        limit: pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    enabled,
  })

export const usePendingReportsCountQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.admin.reports({ status: 'pending', page: 1, limit: 1 }),
    queryFn: () => adminApi.reports({ status: 'pending', page: 1, limit: 1 }),
    enabled,
  })

export const useApproveListingMutation = () =>
  useMutation({
    mutationFn: (productId: string) => adminApi.approveListing(productId),
  })

export const useRerunModerationMutation = () =>
  useMutation({
    mutationFn: (productId: string) => adminApi.rerunModeration(productId),
  })

export const useRejectListingMutation = () =>
  useMutation({
    mutationFn: (productId: string) => adminApi.rejectListing(productId),
  })

export const useResolveReportMutation = () =>
  useMutation({
    mutationFn: (reportId: string) => adminApi.resolveReport(reportId),
  })

export const useDismissReportMutation = () =>
  useMutation({
    mutationFn: (reportId: string) => adminApi.dismissReport(reportId),
  })
