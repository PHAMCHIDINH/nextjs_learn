'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Mail, Lock, User, GraduationCap, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/input-otp'
import { authApi } from '@/lib/api'
import { departmentLabels } from '@/lib/types'
import { useAuth } from '@/providers/auth-provider'
import { toast } from 'sonner'

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }
  return 'Da co loi xay ra'
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
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        const response = await authApi.login({
          email: formData.email,
          password: formData.password,
        })

        setSession(response)
        toast.success('Dang nhap thanh cong')
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
          toast.info('Ma OTP da duoc gui den email cua ban')
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
      toast.error('Vui long nhap du 6 so OTP')
      return
    }

    setIsLoading(true)
    try {
      const response = await authApi.verifyOtp({ email: pendingEmail, code: otp })
      setSession(response)
      toast.success('Xac minh thanh cong')
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
        toast.info(`OTP dev moi: ${response.debugOtp}`)
      } else {
        toast.info('Da gui lai OTP')
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  if (showOTP) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Xac minh email</CardTitle>
            <CardDescription>
              Nhap ma OTP 6 so da duoc gui den
              <br />
              <span className="font-medium text-foreground">{pendingEmail}</span>
            </CardDescription>
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

            <Button onClick={handleOTPSubmit} className="w-full" disabled={otp.length !== 6 || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dang xac minh...
                </>
              ) : (
                'Xac minh'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Khong nhan duoc ma?{' '}
              <button
                onClick={handleResendOTP}
                disabled={isLoading}
                className="font-medium text-primary hover:underline disabled:opacity-50"
              >
                Gui lai
              </button>
            </div>

            <Button variant="ghost" className="w-full gap-2" onClick={() => setShowOTP(false)}>
              <ArrowLeft className="h-4 w-4" />
              Quay lai
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <ShoppingBag className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Cho Sinh Vien</span>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isLogin ? 'Dang nhap' : 'Dang ky tai khoan'}</CardTitle>
            <CardDescription>
              {isLogin ? 'Chao mung tro lai' : 'Tao tai khoan de bat dau mua ban'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Ho va ten</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Nguyen Van A"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentId">Ma so sinh vien</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="studentId"
                        placeholder="20210001"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Khoa / Nganh</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chon khoa / nganh" />
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
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email sinh vien</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@student.edu.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mat khau</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="******"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? 'Dang dang nhap...' : 'Dang dang ky...'}
                  </>
                ) : isLogin ? (
                  'Dang nhap'
                ) : (
                  'Dang ky'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? (
                <>
                  Chua co tai khoan?{' '}
                  <Link href="/auth?mode=register" className="font-medium text-primary hover:underline">
                    Dang ky ngay
                  </Link>
                </>
              ) : (
                <>
                  Da co tai khoan?{' '}
                  <Link href="/auth?mode=login" className="font-medium text-primary hover:underline">
                    Dang nhap
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
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
