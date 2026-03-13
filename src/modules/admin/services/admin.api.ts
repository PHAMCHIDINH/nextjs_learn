import { apiRequest, toQueryString, type ApiQueryValue } from "@/core/api/http";
import { mapPaginatedProducts, mapPaginatedReports } from "@/core/api/mappers";
import type { ModerationJobStatus } from "@/lib/types";

type RerunModerationResponse = {
  message: string;
  listingId: string;
  jobStatus: Extract<ModerationJobStatus, "pending" | "running">;
};

export const adminApi = {
  pendingListings(query?: Record<string, ApiQueryValue>) {
    return apiRequest<unknown>(
      `/admin/listings/pending${toQueryString(query)}`,
    ).then(mapPaginatedProducts);
  },
  rerunModeration(id: string) {
    return apiRequest<RerunModerationResponse>(
      `/admin/listings/${id}/moderation/rerun`,
      { method: "POST" },
    );
  },
  approveListing(id: string) {
    return apiRequest<{ message: string }>(`/admin/listings/${id}/approve`, {
      method: "POST",
    });
  },
  rejectListing(id: string) {
    return apiRequest<{ message: string }>(`/admin/listings/${id}/reject`, {
      method: "POST",
    });
  },
  reports(query?: Record<string, ApiQueryValue>) {
    return apiRequest<unknown>(`/admin/reports${toQueryString(query)}`).then(
      mapPaginatedReports,
    );
  },
  resolveReport(id: string) {
    return apiRequest<{ message: string }>(`/admin/reports/${id}/resolve`, {
      method: "POST",
    });
  },
  dismissReport(id: string) {
    return apiRequest<{ message: string }>(`/admin/reports/${id}/dismiss`, {
      method: "POST",
    });
  },
};
