'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
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
} from '@/shared/ui/alert-dialog'
import { cn, formatPrice } from '@/lib/utils'
import { adminApi, listingsApi, usersApi } from '@/lib/api'
import { categoryLabels, conditionLabels, departmentLabels } from '@/lib/types'
import type { Product, Report } from '@/lib/types'
import { useAuth } from '@/core/providers/auth-provider'

const PAGE_SIZE = 12

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()

  const [pendingList, setPendingList] = useState<Product[]>([])
  const [reportsList, setReportsList] = useState<Report[]>([])
  const [pendingPage, setPendingPage] = useState(1)
  const [reportsPage, setReportsPage] = useState(1)
  const [pendingHasMore, setPendingHasMore] = useState(false)
  const [reportsHasMore, setReportsHasMore] = useState(false)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [pendingReportsTotal, setPendingReportsTotal] = useState(0)
  const [loadingMorePending, setLoadingMorePending] = useState(false)
  const [loadingMoreReports, setLoadingMoreReports] = useState(false)
  const [userCount, setUserCount] = useState(0)
  const [totalListings, setTotalListings] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [pending, reports, reportsPending, users, approvedMeta, rejectedMeta] = await Promise.all([
        adminApi.pendingListings({ page: 1, limit: PAGE_SIZE }),
        adminApi.reports({ page: 1, limit: PAGE_SIZE }),
        adminApi.reports({ status: 'pending', page: 1, limit: 1 }),
        usersApi.list(),
        listingsApi.list({ approvalStatus: 'approved', page: 1, limit: 1 }),
        listingsApi.list({ approvalStatus: 'rejected', page: 1, limit: 1 }),
      ])

      setPendingList(pending.data)
      setReportsList(reports.data)
      setPendingPage(1)
      setReportsPage(1)
      setPendingHasMore(pending.meta.page < pending.meta.totalPages)
      setReportsHasMore(reports.meta.page < reports.meta.totalPages)
      setPendingTotal(pending.meta.total)
      setPendingReportsTotal(reportsPending.meta.total)
      setUserCount(users.length)
      setTotalListings(approvedMeta.meta.total + pending.meta.total + rejectedMeta.meta.total)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không tải dữ liệu admin được')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData()
    }
  }, [user?.id, user?.role])

  const stats = useMemo(
    () => [
      {
        label: 'Chờ duyệt',
        value: pendingTotal,
        icon: Clock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
      },
      {
        label: 'Bị báo cáo',
        value: pendingReportsTotal,
        icon: Flag,
        color: 'text-red-600',
        bg: 'bg-red-100',
      },
      { label: 'Người dùng', value: userCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
      {
        label: 'Tổng bài đăng',
        value: totalListings,
        icon: Package,
        color: 'text-green-600',
        bg: 'bg-green-100',
      },
    ],
    [pendingReportsTotal, pendingTotal, totalListings, userCount],
  )

  const handleApprove = async (productId: string) => {
    try {
      await adminApi.approveListing(productId)
      setPendingList((prev) => prev.filter((p) => p.id !== productId))
      setPendingTotal((prev) => Math.max(0, prev - 1))
      toast.success('Đã duyệt bài đăng')
    } catch {
      toast.error('Không duyệt được bài đăng')
    }
  }

  const handleReject = async (productId: string) => {
    try {
      await adminApi.rejectListing(productId)
      setPendingList((prev) => prev.filter((p) => p.id !== productId))
      setPendingTotal((prev) => Math.max(0, prev - 1))
      toast.success('Đã từ chối bài đăng')
    } catch {
      toast.error('Không từ chối được bài đăng')
    }
  }

  const handleResolveReport = async (reportId: string) => {
    try {
      const previousStatus = reportsList.find((item) => item.id === reportId)?.status
      await adminApi.resolveReport(reportId)
      setReportsList((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r)))
      if (previousStatus === 'pending') {
        setPendingReportsTotal((prev) => Math.max(0, prev - 1))
      }
      toast.success('Đã xử lý báo cáo')
    } catch {
      toast.error('Không xử lý được báo cáo')
    }
  }

  const handleDismissReport = async (reportId: string) => {
    try {
      const previousStatus = reportsList.find((item) => item.id === reportId)?.status
      await adminApi.dismissReport(reportId)
      setReportsList((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'reviewed' } : r)))
      if (previousStatus === 'pending') {
        setPendingReportsTotal((prev) => Math.max(0, prev - 1))
      }
      toast.success('Đã bỏ qua báo cáo')
    } catch {
      toast.error('Không cập nhật được báo cáo')
    }
  }

  const loadMorePending = async () => {
    if (!pendingHasMore || loadingMorePending) {
      return
    }

    const nextPage = pendingPage + 1
    setLoadingMorePending(true)
    try {
      const response = await adminApi.pendingListings({ page: nextPage, limit: PAGE_SIZE })
      setPendingList((prev) => [...prev, ...response.data])
      setPendingPage(nextPage)
      setPendingHasMore(response.meta.page < response.meta.totalPages)
      setPendingTotal(response.meta.total)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không tải thêm bài đăng chờ duyệt')
    } finally {
      setLoadingMorePending(false)
    }
  }

  const loadMoreReports = async () => {
    if (!reportsHasMore || loadingMoreReports) {
      return
    }

    const nextPage = reportsPage + 1
    setLoadingMoreReports(true)
    try {
      const response = await adminApi.reports({ page: nextPage, limit: PAGE_SIZE })
      setReportsList((prev) => [...prev, ...response.data])
      setReportsPage(nextPage)
      setReportsHasMore(response.meta.page < response.meta.totalPages)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không tải thêm báo cáo')
    } finally {
      setLoadingMoreReports(false)
    }
  }

  const reportStatusColors = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    reviewed: 'bg-blue-500/10 text-blue-600',
    resolved: 'bg-green-500/10 text-green-600',
  }

  const reportStatusLabels = {
    pending: 'Chờ xử lý',
    reviewed: 'Đã xem xét',
    resolved: 'Đã giải quyết',
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-muted-foreground">Bạn không có quyền truy cập trang admin</p>
            <Link href="/marketplace">
              <Button>Về marketplace</Button>
            </Link>
          </div>
        </main>
      </div>
    )
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
                  <div className={cn('rounded-lg p-3', stat.bg)}>
                    <stat.icon className={cn('h-6 w-6', stat.color)} />
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
                  <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {pendingTotal}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <Flag className="h-4 w-4" />
                Báo cáo
                {pendingReportsTotal > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {pendingReportsTotal}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Bài đăng chờ duyệt</CardTitle>
                  <CardDescription>Xem xét và duyệt các bài đăng mới từ người dùng</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingList.length > 0 ? (
                    <div className="space-y-4">
                      <div className="divide-y divide-border">
                        {pendingList.map((product) => (
                          <div key={product.id} className="py-6 first:pt-0 last:pb-0">
                            <div className="flex flex-col gap-4 lg:flex-row">
                              <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                                <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                              </div>

                              <div className="flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary">{categoryLabels[product.category]}</Badge>
                                  <Badge variant="outline">{conditionLabels[product.condition]}</Badge>
                                </div>
                                <h3 className="mb-2 text-lg font-semibold">{product.title}</h3>
                                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                                <div className="mb-3 flex items-center gap-4 text-sm">
                                  <span className="font-semibold text-primary">{formatPrice(product.price)}</span>
                                  {product.originalPrice && (
                                    <span className="text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={product.seller.avatar} />
                                    <AvatarFallback>{product.seller.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-medium">{product.seller.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {product.seller.studentId} - {departmentLabels[product.seller.department]}
                                    </p>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(product.createdAt, { addSuffix: true, locale: vi })}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-row gap-2 lg:flex-col">
                                <Button className="flex-1 gap-2 lg:flex-none" onClick={() => handleApprove(product.id)}>
                                  <CheckCircle2 className="h-4 w-4" />
                                  Duyệt
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="flex-1 gap-2 text-destructive hover:text-destructive lg:flex-none">
                                      <XCircle className="h-4 w-4" />
                                      Từ chối
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Từ chối bài đăng?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bài đăng sẽ bị từ chối và người dùng sẽ nhận được thông báo.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleReject(product.id)}
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
                        ))}
                      </div>

                      {pendingHasMore ? (
                        <div className="text-center">
                          <Button variant="outline" onClick={loadMorePending} disabled={loadingMorePending}>
                            {loadingMorePending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang tải...
                              </>
                            ) : (
                              'Tải thêm'
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
                      <h3 className="mb-2 font-semibold">Không có bài đăng chờ duyệt</h3>
                      <p className="text-sm text-muted-foreground">Tất cả bài đăng đã được xử lý</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Báo cáo vi phạm</CardTitle>
                  <CardDescription>Xem xét các bài đăng bị người dùng báo cáo</CardDescription>
                </CardHeader>
                <CardContent>
                  {reportsList.length > 0 ? (
                    <div className="space-y-4">
                      <div className="divide-y divide-border">
                        {reportsList.map((report) => (
                          <div key={report.id} className="py-6 first:pt-0 last:pb-0">
                            <div className="flex flex-col gap-4 lg:flex-row">
                              <div className="flex gap-4">
                                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                                  <Image src={report.product.images[0]} alt={report.product.title} fill className="object-cover" />
                                </div>
                                <div className="flex-1">
                                  <Badge className={cn('mb-2', reportStatusColors[report.status])}>
                                    {reportStatusLabels[report.status]}
                                  </Badge>
                                  <Link href={`/product/${report.product.id}`} className="mb-1 block font-semibold hover:text-primary">
                                    {report.product.title}
                                  </Link>
                                  <p className="text-sm text-muted-foreground">{formatPrice(report.product.price)}</p>
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="mb-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3">
                                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-destructive" />
                                  <div>
                                    <p className="font-medium text-destructive">Lý do báo cáo</p>
                                    <p className="text-sm">{report.reason}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>Báo cáo bởi:</span>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={report.reportedBy.avatar} />
                                      <AvatarFallback>{report.reportedBy.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{report.reportedBy.name}</span>
                                  </div>
                                  <span>-</span>
                                  <span>{formatDistanceToNow(report.createdAt, { addSuffix: true, locale: vi })}</span>
                                </div>
                              </div>

                              {report.status === 'pending' && (
                                <div className="flex flex-row gap-2 lg:flex-col">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" className="flex-1 gap-2 lg:flex-none">
                                        <XCircle className="h-4 w-4" />
                                        Xóa bài đăng
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Xóa bài đăng vi phạm?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Bài đăng sẽ bị xóa và người đăng sẽ nhận được cảnh báo.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleResolveReport(report.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Xóa bài đăng
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <Button variant="outline" className="flex-1 lg:flex-none" onClick={() => handleDismissReport(report.id)}>
                                    Bỏ qua
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {reportsHasMore ? (
                        <div className="text-center">
                          <Button variant="outline" onClick={loadMoreReports} disabled={loadingMoreReports}>
                            {loadingMoreReports ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang tải...
                              </>
                            ) : (
                              'Tải thêm'
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
                      <h3 className="mb-2 font-semibold">Không có báo cáo nào</h3>
                      <p className="text-sm text-muted-foreground">Tất cả báo cáo đã được xử lý</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
      </Tabs>
    </AppShell>
  )
}
