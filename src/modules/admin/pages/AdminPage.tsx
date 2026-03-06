'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShieldCheck,
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
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
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
import { cn } from '@/lib/utils'
import { adminApi, listingsApi, usersApi } from '@/lib/api'
import { categoryLabels, conditionLabels, departmentLabels } from '@/lib/types'
import type { Product, Report } from '@/lib/types'
import { useAuth } from '@/providers/auth-provider'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()

  const [pendingList, setPendingList] = useState<Product[]>([])
  const [reportsList, setReportsList] = useState<Report[]>([])
  const [userCount, setUserCount] = useState(0)
  const [totalListings, setTotalListings] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [pending, reports, users, approvedMeta, rejectedMeta] = await Promise.all([
        adminApi.pendingListings(),
        adminApi.reports(),
        usersApi.list(),
        listingsApi.list({ approvalStatus: 'approved', page: 1, limit: 1 }),
        listingsApi.list({ approvalStatus: 'rejected', page: 1, limit: 1 }),
      ])

      setPendingList(pending)
      setReportsList(reports)
      setUserCount(users.length)
      setTotalListings(approvedMeta.meta.total + pending.length + rejectedMeta.meta.total)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong tai du lieu admin duoc')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role])

  const stats = useMemo(
    () => [
      {
        label: 'Cho duyet',
        value: pendingList.length,
        icon: Clock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
      },
      {
        label: 'Bi bao cao',
        value: reportsList.filter((r) => r.status === 'pending').length,
        icon: Flag,
        color: 'text-red-600',
        bg: 'bg-red-100',
      },
      { label: 'Nguoi dung', value: userCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
      {
        label: 'Tong bai dang',
        value: totalListings,
        icon: Package,
        color: 'text-green-600',
        bg: 'bg-green-100',
      },
    ],
    [pendingList.length, reportsList, userCount, totalListings],
  )

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)

  const handleApprove = async (productId: string) => {
    try {
      await adminApi.approveListing(productId)
      setPendingList((prev) => prev.filter((p) => p.id !== productId))
      toast.success('Da duyet bai dang')
    } catch {
      toast.error('Khong duyet duoc bai dang')
    }
  }

  const handleReject = async (productId: string) => {
    try {
      await adminApi.rejectListing(productId)
      setPendingList((prev) => prev.filter((p) => p.id !== productId))
      toast.success('Da tu choi bai dang')
    } catch {
      toast.error('Khong tu choi duoc bai dang')
    }
  }

  const handleResolveReport = async (reportId: string) => {
    try {
      await adminApi.resolveReport(reportId)
      setReportsList((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r)))
      toast.success('Da xu ly bao cao')
    } catch {
      toast.error('Khong xu ly duoc bao cao')
    }
  }

  const handleDismissReport = async (reportId: string) => {
    try {
      await adminApi.dismissReport(reportId)
      setReportsList((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'reviewed' } : r)))
      toast.success('Da bo qua bao cao')
    } catch {
      toast.error('Khong cap nhat duoc bao cao')
    }
  }

  const reportStatusColors = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    reviewed: 'bg-blue-500/10 text-blue-600',
    resolved: 'bg-green-500/10 text-green-600',
  }

  const reportStatusLabels = {
    pending: 'Cho xu ly',
    reviewed: 'Da xem xet',
    resolved: 'Da giai quyet',
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
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-muted-foreground">Ban khong co quyen truy cap trang admin</p>
            <Link href="/marketplace">
              <Button>Ve marketplace</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30 py-6">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <ShieldCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">Quan ly bai dang va bao cao vi pham</p>
              </div>
            </div>
          </div>

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
                Cho duyet
                {pendingList.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {pendingList.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <Flag className="h-4 w-4" />
                Bao cao
                {reportsList.filter((r) => r.status === 'pending').length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {reportsList.filter((r) => r.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Bai dang cho duyet</CardTitle>
                  <CardDescription>Xem xet va duyet cac bai dang moi tu nguoi dung</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingList.length > 0 ? (
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
                                Duyet
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" className="flex-1 gap-2 text-destructive hover:text-destructive lg:flex-none">
                                    <XCircle className="h-4 w-4" />
                                    Tu choi
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Tu choi bai dang?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bai dang se bi tu choi va nguoi dung se nhan duoc thong bao.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Huy</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleReject(product.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Tu choi
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
                      <h3 className="mb-2 font-semibold">Khong co bai dang cho duyet</h3>
                      <p className="text-sm text-muted-foreground">Tat ca bai dang da duoc xu ly</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Bao cao vi pham</CardTitle>
                  <CardDescription>Xem xet cac bai dang bi nguoi dung bao cao</CardDescription>
                </CardHeader>
                <CardContent>
                  {reportsList.length > 0 ? (
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
                                  <p className="font-medium text-destructive">Ly do bao cao</p>
                                  <p className="text-sm">{report.reason}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>Bao cao boi:</span>
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
                                      Xoa bai dang
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Xoa bai dang vi pham?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bai dang se bi xoa va nguoi dang se nhan duoc canh bao.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Huy</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleResolveReport(report.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Xoa bai dang
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <Button variant="outline" className="flex-1 lg:flex-none" onClick={() => handleDismissReport(report.id)}>
                                  Bo qua
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
                      <h3 className="mb-2 font-semibold">Khong co bao cao nao</h3>
                      <p className="text-sm text-muted-foreground">Tat ca bao cao da duoc xu ly</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
