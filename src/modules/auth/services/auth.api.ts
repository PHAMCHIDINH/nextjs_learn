import { apiRequest } from '@/core/api/http'
import { mapUser } from '@/core/api/mappers'

export const authApi = {
  register(payload: {
    email: string
    password: string
    name: string
    studentId: string
    department: string
  }) {
    return apiRequest<{ message: string; email: string; debugOtp?: string; user: unknown }>('/auth/register', {
      method: 'POST',
      auth: false,
      json: payload,
    }).then((result) => ({
      ...result,
      user: mapUser(result.user),
    }))
  },
  resendOtp(payload: { email: string }) {
    return apiRequest<{ message: string; email: string; debugOtp?: string }>('/auth/resend-otp', {
      method: 'POST',
      auth: false,
      json: payload,
    })
  },
  verifyOtp(payload: { email: string; code: string }) {
    return apiRequest<{ accessToken: string; user: unknown }>('/auth/verify-otp', {
      method: 'POST',
      auth: false,
      json: payload,
    }).then((result) => ({
      accessToken: result.accessToken,
      user: mapUser(result.user),
    }))
  },
  login(payload: { email: string; password: string }) {
    return apiRequest<{ accessToken: string; user: unknown }>('/auth/login', {
      method: 'POST',
      auth: false,
      json: payload,
    }).then((result) => ({
      accessToken: result.accessToken,
      user: mapUser(result.user),
    }))
  },
  me() {
    return apiRequest<unknown>('/auth/me').then(mapUser)
  },
  logout() {
    return apiRequest<{ message: string }>('/auth/logout', { method: 'POST' })
  },
}
