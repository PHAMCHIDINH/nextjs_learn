"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Flag,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { queryKeys } from "@/core/query/keys";
import { cn, formatPrice } from "@/lib/utils";
import { categoryLabels, conditionLabels, departmentLabels } from "@/lib/types";
import { useAuth } from "@/core/providers/auth-provider";
import {
  useApproveListingMutation,
  useDismissReportMutation,
  usePendingListingsInfiniteQuery,
  usePendingReportsCountQuery,
  useRejectListingMutation,
  useReportsInfiniteQuery,
  useRerunModerationMutation,
  useResolveReportMutation,
} from "@/modules/admin/services/admin.queries";
import { useListingsQuery } from "@/modules/listings/services/listings.queries";
import { useUsersListQuery } from "@/modules/users/services/users.queries";

const PAGE_SIZE = 12;

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";

  const pendingQuery = usePendingListingsInfiniteQuery({
    params: {},
    pageSize: PAGE_SIZE,
    enabled: isAdmin,
  });
  const reportsQuery = useReportsInfiniteQuery({
    params: {},
    pageSize: PAGE_SIZE,
    enabled: isAdmin,
  });
  const pendingReportsCountQuery = usePendingReportsCountQuery(isAdmin);
  const usersQuery = useUsersListQuery(isAdmin);
  const approvedMetaQuery = useListingsQuery({
    params: { approvalStatus: "approved", page: 1, limit: 1 },
    enabled: isAdmin,
  });
  const rejectedMetaQuery = useListingsQuery({
    params: { approvalStatus: "rejected", page: 1, limit: 1 },
    enabled: isAdmin,
  });

  const approveListingMutation = useApproveListingMutation();
  const rerunModerationMutation = useRerunModerationMutation();
  const rejectListingMutation = useRejectListingMutation();
  const resolveReportMutation = useResolveReportMutation();
  const dismissReportMutation = useDismissReportMutation();

  const pendingList =
    pendingQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const reportsList =
    reportsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const pendingTotal = pendingQuery.data?.pages[0]?.meta.total ?? 0;
  const pendingReportsTotal = pendingReportsCountQuery.data?.meta.total ?? 0;
  const userCount = usersQuery.data?.length ?? 0;
  const totalListings =
    (approvedMetaQuery.data?.meta.total ?? 0) +
    pendingTotal +
    (rejectedMetaQuery.data?.meta.total ?? 0);

  const loading =
    authLoading ||
    (isAdmin &&
      (pendingQuery.isPending ||
        reportsQuery.isPending ||
        pendingReportsCountQuery.isPending ||
        usersQuery.isPending ||
        approvedMetaQuery.isPending ||
        rejectedMetaQuery.isPending));

  useEffect(() => {
    const error =
      pendingQuery.error ??
      reportsQuery.error ??
      pendingReportsCountQuery.error ??
      usersQuery.error ??
      approvedMetaQuery.error ??
      rejectedMetaQuery.error;

    if (error instanceof Error) {
      toast.error(error.message);
    }
  }, [
    approvedMetaQuery.error,
    pendingQuery.error,
    pendingReportsCountQuery.error,
    rejectedMetaQuery.error,
    reportsQuery.error,
    usersQuery.error,
  ]);

  const stats = useMemo(
    () => [
      {
        label: "Chờ duyệt",
        value: pendingTotal,
        icon: Clock,
        color: "text-yellow-600",
        bg: "bg-yellow-100",
      },
      {
        label: "Bị báo cáo",
        value: pendingReportsTotal,
        icon: Flag,
        color: "text-red-600",
        bg: "bg-red-100",
      },
      {
        label: "Người dùng",
        value: userCount,
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-100",
      },
      {
        label: "Tổng bài đăng",
        value: totalListings,
        icon: Package,
        color: "text-green-600",
        bg: "bg-green-100",
      },
    ],
    [pendingReportsTotal, pendingTotal, totalListings, userCount],
  );

  const handleApprove = async (productId: string) => {
    try {
      await approveListingMutation.mutateAsync(productId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.listings.all }),
      ]);
      toast.success("Đã duyệt bài đăng");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không duyệt được bài đăng",
      );
    }
  };

  const handleReject = async (productId: string) => {
    try {
      await rejectListingMutation.mutateAsync(productId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.listings.all }),
      ]);
      toast.success("Đã từ chối bài đăng");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không từ chối được bài đăng",
      );
    }
  };

  const handleRerunModeration = async (productId: string) => {
    try {
      const response = await rerunModerationMutation.mutateAsync(productId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.listings.all }),
      ]);
      toast.success(
        response.jobStatus === "running"
          ? "AI moderation đang xử lý bài đăng này"
          : "Đã đưa bài đăng vào hàng đợi AI moderation",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không chạy lại được AI moderation",
      );
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await resolveReportMutation.mutateAsync(reportId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.listings.all }),
      ]);
      toast.success("Đã xử lý báo cáo");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không xử lý được báo cáo",
      );
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await dismissReportMutation.mutateAsync(reportId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success("Đã bỏ qua báo cáo");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không cập nhật được báo cáo",
      );
    }
  };

  const loadMorePending = async () => {
    if (!pendingQuery.hasNextPage || pendingQuery.isFetchingNextPage) {
      return;
    }

    await pendingQuery.fetchNextPage();
  };

  const loadMoreReports = async () => {
    if (!reportsQuery.hasNextPage || reportsQuery.isFetchingNextPage) {
      return;
    }

    await reportsQuery.fetchNextPage();
  };

  const reportStatusColors = {
    pending: "bg-yellow-500/10 text-yellow-600",
    reviewed: "bg-blue-500/10 text-blue-600",
    resolved: "bg-green-500/10 text-green-600",
  };

  const reportStatusLabels = {
    pending: "Chờ xử lý",
    reviewed: "Đã xem xét",
    resolved: "Đã giải quyết",
  };

  const moderationRiskColors = {
    low: "bg-green-500/10 text-green-700",
    medium: "bg-yellow-500/10 text-yellow-700",
    high: "bg-red-500/10 text-red-700",
    error: "bg-zinc-500/10 text-zinc-700",
  } as const;

  const moderationRiskLabels = {
    low: "Rủi ro thấp",
    medium: "Cần xem kỹ",
    high: "Rủi ro cao",
    error: "AI lỗi",
  } as const;

  const moderationActionLabels = {
    approve: "Đề xuất duyệt",
    manual_review: "Cần admin xem",
  } as const;

  const moderationJobLabels = {
    pending: "AI đang xếp hàng",
    running: "AI đang xử lý",
    completed: "AI đã xử lý",
    failed: "AI xử lý lỗi",
  } as const;

  const moderationJobColors = {
    pending: "bg-blue-500/10 text-blue-700",
    running: "bg-sky-500/10 text-sky-700",
    completed: "bg-emerald-500/10 text-emerald-700",
    failed: "bg-zinc-500/10 text-zinc-700",
  } as const;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-muted-foreground">
              Bạn không có quyền truy cập trang admin
            </p>
            <Link href="/marketplace">
              <Button>Về marketplace</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AppShell
      title="Admin Panel"
      description="Quản lý bài đăng và báo cáo vi phạm"
      actions={
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Về dashboard
          </Button>
        </Link>
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={cn("rounded-lg p-3", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Chờ duyệt
            {pendingTotal > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {pendingTotal}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <Flag className="h-4 w-4" />
            Báo cáo
            {pendingReportsTotal > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {pendingReportsTotal}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Bài đăng chờ duyệt</CardTitle>
              <CardDescription>
                Xem xét và duyệt các bài đăng mới từ người dùng
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingList.length > 0 ? (
                <div className="space-y-4">
                  <div className="divide-y divide-border">
                    {pendingList.map((product) => {
                      const isModerationProcessing =
                        product.moderationJobStatus === "pending" ||
                        product.moderationJobStatus === "running";

                      return (
                        <div
                          key={product.id}
                          className="py-6 first:pt-0 last:pb-0"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row">
                            <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                              <Image
                                src={product.images[0]}
                                alt={product.title}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="flex-1">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">
                                  {categoryLabels[product.category]}
                                </Badge>
                                <Badge variant="outline">
                                  {conditionLabels[product.condition]}
                                </Badge>
                                {product.moderationJobStatus ? (
                                  <Badge
                                    className={
                                      moderationJobColors[
                                        product.moderationJobStatus
                                      ]
                                    }
                                  >
                                    {
                                      moderationJobLabels[
                                        product.moderationJobStatus
                                      ]
                                    }
                                  </Badge>
                                ) : null}
                              </div>
                              <h3 className="mb-2 text-lg font-semibold">
                                {product.title}
                              </h3>
                              <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                                {product.description}
                              </p>
                              <div className="mb-3 flex items-center gap-4 text-sm">
                                <span className="font-semibold text-primary">
                                  {formatPrice(product.price)}
                                </span>
                                {product.originalPrice && (
                                  <span className="text-muted-foreground line-through">
                                    {formatPrice(product.originalPrice)}
                                  </span>
                                )}
                              </div>

                              {product.latestModeration ? (
                                <div className="mb-3 rounded-lg border border-border/70 bg-muted/30 p-3">
                                  <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <Badge
                                      className={
                                        moderationRiskColors[
                                          product.latestModeration.riskLevel
                                        ]
                                      }
                                    >
                                      {
                                        moderationRiskLabels[
                                          product.latestModeration.riskLevel
                                        ]
                                      }
                                    </Badge>
                                    {product.latestModeration
                                      .recommendedAction ? (
                                      <Badge variant="outline">
                                        {
                                          moderationActionLabels[
                                            product.latestModeration
                                              .recommendedAction
                                          ]
                                        }
                                      </Badge>
                                    ) : null}
                                    <span className="text-xs text-muted-foreground">
                                      Confidence:{" "}
                                      {product.latestModeration.confidence !==
                                      null
                                        ? `${Math.round(product.latestModeration.confidence * 100)}%`
                                        : "N/A"}
                                    </span>
                                  </div>
                                  {product.latestModeration.summary ? (
                                    <p className="text-sm">
                                      {product.latestModeration.summary}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      Chưa có tóm tắt moderation.
                                    </p>
                                  )}
                                  {product.latestModeration.violations.length >
                                  0 ? (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      Vi phạm:{" "}
                                      {product.latestModeration.violations.join(
                                        ", ",
                                      )}
                                    </p>
                                  ) : null}
                                  {isModerationProcessing ? (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      AI đang xử lý lại bài đăng này. Kết quả
                                      mới sẽ xuất hiện sau khi job hoàn tất.
                                    </p>
                                  ) : null}
                                </div>
                              ) : isModerationProcessing ? (
                                <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-sm text-blue-700">
                                  AI đang xử lý moderation cho bài đăng này.
                                  Admin có thể quay lại sau vài giây để xem kết
                                  quả.
                                </div>
                              ) : (
                                <div className="mb-3 rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                                  Chưa có kết quả AI moderation cho bài đăng
                                  này.
                                </div>
                              )}

                              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={product.seller.avatar} />
                                  <AvatarFallback>
                                    {product.seller.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {product.seller.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {product.seller.studentId} -{" "}
                                    {
                                      departmentLabels[
                                        product.seller.department
                                      ]
                                    }
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(product.createdAt, {
                                    addSuffix: true,
                                    locale: vi,
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-row gap-2 lg:flex-col">
                              <Button
                                variant="outline"
                                className="flex-1 gap-2 lg:flex-none"
                                onClick={() =>
                                  void handleRerunModeration(product.id)
                                }
                                disabled={rerunModerationMutation.isPending}
                              >
                                {rerunModerationMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw
                                    className={cn(
                                      "h-4 w-4",
                                      isModerationProcessing && "animate-spin",
                                    )}
                                  />
                                )}
                                Chạy lại AI
                              </Button>
                              <Button
                                className="flex-1 gap-2 lg:flex-none"
                                onClick={() => void handleApprove(product.id)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Duyệt
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="flex-1 gap-2 text-destructive hover:text-destructive lg:flex-none"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Từ chối
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Từ chối bài đăng?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bài đăng sẽ bị từ chối và người dùng sẽ
                                      nhận được thông báo.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        void handleReject(product.id)
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Từ chối
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {pendingQuery.hasNextPage ? (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => void loadMorePending()}
                        disabled={pendingQuery.isFetchingNextPage}
                      >
                        {pendingQuery.isFetchingNextPage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang tải...
                          </>
                        ) : (
                          "Tải thêm"
                        )}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
                  <h3 className="mb-2 font-semibold">
                    Không có bài đăng chờ duyệt
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tất cả bài đăng đã được xử lý
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo vi phạm</CardTitle>
              <CardDescription>
                Xem xét các bài đăng bị người dùng báo cáo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsList.length > 0 ? (
                <div className="space-y-4">
                  <div className="divide-y divide-border">
                    {reportsList.map((report) => (
                      <div
                        key={report.id}
                        className="py-6 first:pt-0 last:pb-0"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row">
                          <div className="flex gap-4">
                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                              <Image
                                src={report.product.images[0]}
                                alt={report.product.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <Badge
                                className={cn(
                                  "mb-2",
                                  reportStatusColors[report.status],
                                )}
                              >
                                {reportStatusLabels[report.status]}
                              </Badge>
                              <Link
                                href={`/product/${report.product.id}`}
                                className="mb-1 block font-semibold hover:text-primary"
                              >
                                {report.product.title}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(report.product.price)}
                              </p>
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="mb-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3">
                              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-destructive" />
                              <div>
                                <p className="font-medium text-destructive">
                                  Lý do báo cáo
                                </p>
                                <p className="text-sm">{report.reason}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>Báo cáo bởi:</span>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={report.reportedBy.avatar} />
                                  <AvatarFallback>
                                    {report.reportedBy.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{report.reportedBy.name}</span>
                              </div>
                              <span>-</span>
                              <span>
                                {formatDistanceToNow(report.createdAt, {
                                  addSuffix: true,
                                  locale: vi,
                                })}
                              </span>
                            </div>
                          </div>

                          {report.status === "pending" && (
                            <div className="flex flex-row gap-2 lg:flex-col">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    className="flex-1 gap-2 lg:flex-none"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Xóa bài đăng
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Xóa bài đăng vi phạm?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bài đăng sẽ bị xóa và người đăng sẽ nhận
                                      được cảnh báo.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        void handleResolveReport(report.id)
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Xóa bài đăng
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <Button
                                variant="outline"
                                className="flex-1 lg:flex-none"
                                onClick={() =>
                                  void handleDismissReport(report.id)
                                }
                              >
                                Bỏ qua
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {reportsQuery.hasNextPage ? (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => void loadMoreReports()}
                        disabled={reportsQuery.isFetchingNextPage}
                      >
                        {reportsQuery.isFetchingNextPage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang tải...
                          </>
                        ) : (
                          "Tải thêm"
                        )}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
                  <h3 className="mb-2 font-semibold">Không có báo cáo nào</h3>
                  <p className="text-sm text-muted-foreground">
                    Tất cả báo cáo đã được xử lý
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
