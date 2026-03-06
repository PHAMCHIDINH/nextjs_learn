'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/lib/api'
import { departmentLabels } from '@/lib/types'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/input-otp'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return 'Đã có lỗi xảy ra'
}

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'login'

  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [showOTP, setShowOTP] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const { setSession, user } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    studentId: '',
    department: '',
  })

  useEffect(() => {
    setIsLogin(mode === 'login')
  }, [mode])

  useEffect(() => {
    if (user) {
      router.replace('/marketplace')
    }
  }, [router, user])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        const response = await authApi.login({
          email: formData.email,
          password: formData.password,
        })

        setSession(response)
        toast.success('Đăng nhập thành công')
        router.push('/marketplace')
      } else {
        const response = await authApi.register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          studentId: formData.studentId,
          department: formData.department,
        })

        setPendingEmail(response.email)
        setShowOTP(true)
        if (response.debugOtp) {
          setOtp(response.debugOtp)
          toast.info(`OTP dev: ${response.debugOtp}`)
        } else {
          toast.info('Mã OTP đã được gửi đến email của bạn')
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPSubmit = async () => {
    if (otp.length !== 6) {
      toast.error('Vui lòng nhập đủ 6 số OTP')
      return
    }

    setIsLoading(true)
    try {
      const response = await authApi.verifyOtp({ email: pendingEmail, code: otp })
      setSession(response)
      toast.success('Xác minh thành công')
      router.push('/marketplace')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsLoading(true)
    try {
      const response = await authApi.resendOtp({ email: pendingEmail })
      if (response.debugOtp) {
        setOtp(response.debugOtp)
        toast.info(`OTP dev mới: ${response.debugOtp}`)
      } else {
        toast.info('Đã gửi lại OTP')
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  if (showOTP) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_24%),linear-gradient(180deg,_rgba(250,250,249,1)_0%,_rgba(244,244,245,1)_100%)] px-4 py-10">
        <div className="mx-auto flex max-w-5xl items-center justify-center">
          <Card className="w-full max-w-md border-border/70 bg-white/90 shadow-2xl shadow-zinc-950/5">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Xác minh email</CardTitle>
                <CardDescription className="mt-2">
                  Nhập mã OTP 6 số đã được gửi đến
                  <br />
                  <span className="font-medium text-foreground">{pendingEmail}</span>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button onClick={handleOTPSubmit} className="w-full rounded-full" disabled={otp.length !== 6 || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xác minh...
                  </>
                ) : (
                  'Xác minh'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Không nhận được mã?{' '}
                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Gửi lại
                </button>
              </div>

              <Button variant="ghost" className="w-full gap-2 rounded-full" onClick={() => setShowOTP(false)}>
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.14),_transparent_22%),radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_24%),linear-gradient(180deg,_rgba(250,250,249,1)_0%,_rgba(244,244,245,1)_100%)] px-4 py-8 md:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 lg:grid-cols-[1fr_460px] lg:items-center">
        <div className="hidden lg:block">
          <div className="max-w-2xl">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold tracking-tight">Chợ Sinh Viên</span>
            </Link>

            <h1 className="mt-8 text-balance text-5xl font-semibold tracking-tight text-foreground">
              Đăng nhập để tiếp tục mua bán trong cộng đồng sinh viên của bạn.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Một luồng xác minh gọn, rõ và đủ an tâm để mọi giao dịch bắt đầu từ người thật, trong trường thật.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Xác minh rõ ràng',
                  description: 'Đăng ký bằng email trường và OTP.',
                },
                {
                  icon: GraduationCap,
                  title: 'Đúng đối tượng',
                  description: 'Chỉ tập trung vào giao dịch của sinh viên.',
                },
                {
                  icon: Sparkles,
                  title: 'Đi vào việc nhanh',
                  description: 'Vào marketplace hoặc đăng tin ngay sau khi xong.',
                },
              ].map((item) => {
                const Icon = item.icon

                return (
                  <Card key={item.title} className="border-border/70 bg-white/75 shadow-sm">
                    <CardContent className="p-5">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="mb-6 flex items-center justify-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold tracking-tight">Chợ Sinh Viên</span>
            </Link>
          </div>

          <Card className="border-border/70 bg-white/92 shadow-2xl shadow-zinc-950/5">
            <CardHeader className="space-y-3 text-center">
              <CardTitle className="text-3xl">{isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}</CardTitle>
              <CardDescription>
                {isLogin ? 'Chào mừng bạn quay lại với chợ nội bộ.' : 'Tạo tài khoản để bắt đầu mua bán trong trường.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Họ và tên</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="Nguyễn Văn A"
                          value={formData.name}
                          onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                          className="h-11 rounded-xl pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="studentId">Mã số sinh viên</Label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="studentId"
                            placeholder="20210001"
                            value={formData.studentId}
                            onChange={(event) => setFormData({ ...formData, studentId: event.target.value })}
                            className="h-11 rounded-xl pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department">Khoa / ngành</Label>
                        <Select
                          value={formData.department}
                          onValueChange={(value) => setFormData({ ...formData, department: value })}
                          required
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Chọn khoa / ngành" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(departmentLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="email">Email sinh viên</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@student.edu.vn"
                      value={formData.email}
                      onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                      className="h-11 rounded-xl pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Nhập mật khẩu"
                      value={formData.password}
                      onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                      className="h-11 rounded-xl pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="h-11 w-full rounded-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...'}
                    </>
                  ) : isLogin ? (
                    'Đăng nhập'
                  ) : (
                    'Đăng ký'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {isLogin ? (
                  <>
                    Chưa có tài khoản?{' '}
                    <Link href="/auth?mode=register" className="font-medium text-primary hover:underline">
                      Đăng ký ngay
                    </Link>
                  </>
                ) : (
                  <>
                    Đã có tài khoản?{' '}
                    <Link href="/auth?mode=login" className="font-medium text-primary hover:underline">
                      Đăng nhập
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  )
}
