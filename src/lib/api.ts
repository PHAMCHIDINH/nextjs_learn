import type {
  CategoryItem,
  Conversation,
  DashboardSummary,
  Message,
  PaginatedResponse,
  Product,
  Report,
  User,
} from '@/lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
const ACCESS_TOKEN_KEY = 'cho_sinh_vien_access_token'

type ApiRequestOptions = RequestInit & {
  json?: unknown
  auth?: boolean
}

export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.status = status
    this.data = data
  }
}

const toDate = (value: string | Date | null | undefined): Date => {
  if (!value) {
    return new Date()
  }
  return value instanceof Date ? value : new Date(value)
}

const toQueryString = (query?: Record<string, string | number | undefined | null>) => {
  if (!query) {
    return ''
  }

  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  const text = params.toString()
  return text ? `?${text}` : ''
}

const getAccessToken = () => {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export const setAccessToken = (token: string) => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const clearAccessToken = () => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
}

const mapUser = (value: any): User => ({
  id: value.id,
  name: value.name,
  email: value.email,
  studentId: value.studentId,
  department: value.department,
  avatar: value.avatar,
  verified: value.verified,
  createdAt: toDate(value.createdAt),
  lastSeen: value.lastSeen ? toDate(value.lastSeen) : undefined,
  online: value.online,
  role: value.role,
})

const mapProduct = (value: any): Product => ({
  id: value.id,
  title: value.title,
  description: value.description,
  price: value.price,
  originalPrice: value.originalPrice ?? undefined,
  images: Array.isArray(value.images) ? value.images : [],
  category: value.category,
  condition: value.condition,
  status: value.status,
  seller: mapUser(value.seller),
  department: value.department ?? value.seller?.department ?? 'cntt',
  createdAt: toDate(value.createdAt),
  updatedAt: toDate(value.updatedAt),
  views: value.views ?? 0,
  savedBy: Array.isArray(value.savedBy) ? value.savedBy : [],
  isSaved: value.isSaved,
  approvalStatus: value.approvalStatus,
})

const mapMessage = (value: any): Message => ({
  id: value.id,
  senderId: value.senderId,
  receiverId: value.receiverId,
  content: value.content ?? '',
  type: value.type,
  imageUrl: value.imageUrl ?? undefined,
  createdAt: toDate(value.createdAt),
  read: Boolean(value.read),
  productId: value.productId ?? undefined,
})

const mapConversation = (value: any): Conversation => ({
  id: value.id,
  participants: Array.isArray(value.participants) ? value.participants.map(mapUser) : [],
  lastMessage: value.lastMessage ? mapMessage(value.lastMessage) : undefined,
  product: value.product ? mapProduct(value.product) : undefined,
  unreadCount: value.unreadCount ?? 0,
  updatedAt: toDate(value.updatedAt),
})

const mapReport = (value: any): Report => ({
  id: value.id,
  productId: value.productId ?? value.listingId,
  product: mapProduct(value.product),
  reason: value.reason,
  reportedBy: mapUser(value.reportedBy),
  createdAt: toDate(value.createdAt),
  status: value.status,
})

const mapPaginatedProducts = (value: any): PaginatedResponse<Product> => ({
  data: Array.isArray(value?.data) ? value.data.map(mapProduct) : [],
  meta: value?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 0 },
})

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { json, auth = true, headers, ...rest } = options
  const token = auth ? getAccessToken() : null

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })

  const raw = await response.text()
  const data = raw ? JSON.parse(raw) : null

  if (!response.ok) {
    const message =
      data?.message && typeof data.message === 'string'
        ? data.message
        : `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, data)
  }

  return data as T
}

export const authApi = {
  register(payload: {
    email: string
    password: string
    name: string
    studentId: string
    department: string
  }) {
    return apiRequest<{ message: string; email: string; debugOtp?: string; user: User }>(
      '/auth/register',
      {
        method: 'POST',
        auth: false,
        json: payload,
      },
    ).then((result) => ({
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
    return apiRequest<{ accessToken: string; user: User }>('/auth/verify-otp', {
      method: 'POST',
      auth: false,
      json: payload,
    }).then((result) => ({
      accessToken: result.accessToken,
      user: mapUser(result.user),
    }))
  },
  login(payload: { email: string; password: string }) {
    return apiRequest<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      auth: false,
      json: payload,
    }).then((result) => ({
      accessToken: result.accessToken,
      user: mapUser(result.user),
    }))
  },
  me() {
    return apiRequest<User>('/auth/me').then(mapUser)
  },
  logout() {
    return apiRequest<{ message: string }>('/auth/logout', { method: 'POST' })
  },
}

export const usersApi = {
  list() {
    return apiRequest<any[]>('/users', { auth: false }).then((items) => items.map(mapUser))
  },
  me() {
    return apiRequest<User>('/users/me').then(mapUser)
  },
  myListings(query?: Record<string, string | number | undefined>) {
    return apiRequest<any>(`/users/me/listings${toQueryString(query)}`).then(mapPaginatedProducts)
  },
  mySavedListings(query?: Record<string, string | number | undefined>) {
    return apiRequest<any>(`/users/me/saved-listings${toQueryString(query)}`).then(
      mapPaginatedProducts,
    )
  },
}

export const categoriesApi = {
  list() {
    return apiRequest<CategoryItem[]>('/categories')
  },
}

export const listingsApi = {
  list(query?: Record<string, string | number | undefined>) {
    return apiRequest<any>(`/listings${toQueryString(query)}`, {
      auth: false,
    }).then(mapPaginatedProducts)
  },
  byId(id: string) {
    return apiRequest<any>(`/listings/${id}`, { auth: false }).then(mapProduct)
  },
  bySeller(sellerId: string, query?: Record<string, string | number | undefined>) {
    return apiRequest<any>(`/listings/seller/${sellerId}${toQueryString(query)}`, {
      auth: false,
    }).then(mapPaginatedProducts)
  },
  create(payload: {
    title: string
    description: string
    price: number
    originalPrice?: number
    category: string
    condition: string
    department?: string
    images?: string[]
  }) {
    return apiRequest<any>('/listings', {
      method: 'POST',
      json: payload,
    }).then(mapProduct)
  },
  update(id: string, payload: Record<string, unknown>) {
    return apiRequest<any>(`/listings/${id}`, {
      method: 'PATCH',
      json: payload,
    }).then(mapProduct)
  },
  remove(id: string) {
    return apiRequest<{ message: string }>(`/listings/${id}`, {
      method: 'DELETE',
    })
  },
  updateStatus(id: string, status: string) {
    return apiRequest<any>(`/listings/${id}/status`, {
      method: 'PATCH',
      json: { status },
    }).then(mapProduct)
  },
  save(id: string) {
    return apiRequest<{ saved: boolean }>(`/listings/${id}/save`, {
      method: 'POST',
    })
  },
  unsave(id: string) {
    return apiRequest<{ saved: boolean }>(`/listings/${id}/save`, {
      method: 'DELETE',
    })
  },
}

export const dashboardApi = {
  summary() {
    return apiRequest<DashboardSummary>('/dashboard/summary')
  },
}

export const reportsApi = {
  create(payload: { listingId: string; reason: string }) {
    return apiRequest('/reports', {
      method: 'POST',
      json: payload,
    })
  },
}

export const conversationsApi = {
  list() {
    return apiRequest<any[]>('/conversations').then((items) => items.map(mapConversation))
  },
  create(payload: { participantId: string; productId?: string }) {
    return apiRequest<any>('/conversations', {
      method: 'POST',
      json: payload,
    }).then(mapConversation)
  },
  messages(conversationId: string, query?: Record<string, string | number | undefined>) {
    return apiRequest<{ data: any[]; meta: any }>(
      `/conversations/${conversationId}/messages${toQueryString(query)}`,
    ).then((result) => ({
      data: result.data.map(mapMessage),
      meta: result.meta,
    }))
  },
  sendMessage(
    conversationId: string,
    payload: { content?: string; imageUrl?: string; type?: 'text' | 'image' },
  ) {
    return apiRequest<any>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      json: payload,
    }).then(mapMessage)
  },
  markRead(conversationId: string) {
    return apiRequest<{ message: string }>(`/conversations/${conversationId}/read`, {
      method: 'PATCH',
    })
  },
}

export const adminApi = {
  pendingListings() {
    return apiRequest<any[]>('/admin/listings/pending').then((items) => items.map(mapProduct))
  },
  approveListing(id: string) {
    return apiRequest<{ message: string }>(`/admin/listings/${id}/approve`, { method: 'POST' })
  },
  rejectListing(id: string) {
    return apiRequest<{ message: string }>(`/admin/listings/${id}/reject`, { method: 'POST' })
  },
  reports(status?: string) {
    return apiRequest<any[]>(`/admin/reports${toQueryString({ status })}`).then((items) =>
      items.map(mapReport),
    )
  },
  resolveReport(id: string) {
    return apiRequest<{ message: string }>(`/admin/reports/${id}/resolve`, { method: 'POST' })
  },
  dismissReport(id: string) {
    return apiRequest<{ message: string }>(`/admin/reports/${id}/dismiss`, { method: 'POST' })
  },
}
