import type {
  Category,
  CategoryItem,
  Condition,
  Conversation,
  DashboardSummary,
  Department,
  Message,
  PaginatedResponse,
  Product,
  ProductStatus,
  Report,
  UploadedImage,
  User,
} from '@/lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
const ACCESS_TOKEN_KEY = 'cho_sinh_vien_access_token'

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  json?: unknown
  formData?: FormData
  auth?: boolean
}

type ApiMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

type ListingImagePayload = string | { url: string; publicId?: string }

type ListingWritePayload = {
  title: string
  description: string
  price: number
  originalPrice?: number
  category: string
  condition: string
  department?: string
  images?: ListingImagePayload[]
}

type ListingUpdatePayload = Partial<{
  title: string
  description: string
  price: number
  originalPrice: number
  category: string
  condition: string
  department: string
  status: ProductStatus
}>

type UserAvatarPayload =
  | {
      url: string
      publicId?: string
    }
  | null

type UserUpdatePayload = Partial<{
  name: string
  department: Department
  avatar: UserAvatarPayload
}>

type UnknownRecord = Record<string, unknown>

const CATEGORIES: Category[] = ['textbook', 'electronics', 'dorm', 'study', 'other']
const CONDITIONS: Condition[] = ['new', 'like-new', 'good', 'fair']
const STATUSES: ProductStatus[] = ['selling', 'reserved', 'sold']
const DEPARTMENTS: Department[] = ['cntt', 'kinhtoe', 'marketing', 'ngoaingu', 'luat', 'quanly', 'kythuat']
const REPORT_STATUSES: Array<Report['status']> = ['pending', 'reviewed', 'resolved']
const MESSAGE_TYPES: Array<Message['type']> = ['text', 'image']
const USER_ROLES: Array<NonNullable<User['role']>> = ['user', 'admin']

export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.status = status
    this.data = data
  }
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return fallback
}

const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback

const normalizeEnum = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => {
  if (typeof value !== 'string') {
    return fallback
  }
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

const normalizeCategory = (value: unknown): Category =>
  normalizeEnum(value, CATEGORIES, 'other')

const normalizeCondition = (value: unknown): Condition =>
  normalizeEnum(value, CONDITIONS, 'good')

const normalizeStatus = (value: unknown): ProductStatus =>
  normalizeEnum(value, STATUSES, 'selling')

const normalizeDepartment = (value: unknown): Department =>
  normalizeEnum(value, DEPARTMENTS, 'cntt')

const normalizeRole = (value: unknown): User['role'] =>
  normalizeEnum(value, USER_ROLES, 'user')

const normalizeMessageType = (value: unknown): Message['type'] =>
  normalizeEnum(value, MESSAGE_TYPES, 'text')

const normalizeReportStatus = (value: unknown): Report['status'] =>
  normalizeEnum(value, REPORT_STATUSES, 'pending')

const toDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }
  return new Date()
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

export const getAccessToken = () => {
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

const mapUser = (value: unknown): User => {
  const source = isRecord(value) ? value : {}
  return {
    id: asString(source.id),
    name: asString(source.name),
    email: asString(source.email),
    studentId: asString(source.studentId),
    department: normalizeDepartment(source.department),
    avatar: typeof source.avatar === 'string' ? source.avatar : undefined,
    verified: asBoolean(source.verified),
    createdAt: toDate(source.createdAt),
    lastSeen: source.lastSeen ? toDate(source.lastSeen) : undefined,
    online: asBoolean(source.online),
    role: normalizeRole(source.role),
  }
}

const mapProduct = (value: unknown): Product => {
  const source = isRecord(value) ? value : {}
  const images = Array.isArray(source.images) ? source.images.filter((item): item is string => typeof item === 'string') : []
  const savedBy = Array.isArray(source.savedBy)
    ? source.savedBy.filter((item): item is string => typeof item === 'string')
    : []

  const seller = mapUser(source.seller)

  return {
    id: asString(source.id),
    title: asString(source.title),
    description: asString(source.description),
    price: asNumber(source.price),
    originalPrice: source.originalPrice === undefined || source.originalPrice === null ? undefined : asNumber(source.originalPrice),
    images,
    category: normalizeCategory(source.category),
    condition: normalizeCondition(source.condition),
    status: normalizeStatus(source.status),
    seller,
    department: source.department ? normalizeDepartment(source.department) : seller.department,
    createdAt: toDate(source.createdAt),
    updatedAt: toDate(source.updatedAt),
    views: asNumber(source.views),
    savedBy,
    isSaved: source.isSaved === undefined ? undefined : asBoolean(source.isSaved),
    approvalStatus:
      source.approvalStatus === 'pending' || source.approvalStatus === 'approved' || source.approvalStatus === 'rejected'
        ? source.approvalStatus
        : undefined,
  }
}

const mapMessage = (value: unknown): Message => {
  const source = isRecord(value) ? value : {}
  return {
    id: asString(source.id),
    senderId: asString(source.senderId),
    receiverId: asString(source.receiverId),
    content: asString(source.content),
    type: normalizeMessageType(source.type),
    imageUrl: typeof source.imageUrl === 'string' ? source.imageUrl : undefined,
    createdAt: toDate(source.createdAt),
    read: asBoolean(source.read),
    productId: typeof source.productId === 'string' ? source.productId : undefined,
  }
}

const mapConversation = (value: unknown): Conversation => {
  const source = isRecord(value) ? value : {}
  const participants = Array.isArray(source.participants) ? source.participants.map(mapUser) : []
  return {
    id: asString(source.id),
    participants,
    lastMessage: source.lastMessage ? mapMessage(source.lastMessage) : undefined,
    product: source.product ? mapProduct(source.product) : undefined,
    unreadCount: asNumber(source.unreadCount),
    updatedAt: toDate(source.updatedAt),
  }
}

const mapReport = (value: unknown): Report => {
  const source = isRecord(value) ? value : {}
  return {
    id: asString(source.id),
    productId: asString(source.productId || source.listingId),
    product: mapProduct(source.product),
    reason: asString(source.reason),
    reportedBy: mapUser(source.reportedBy),
    createdAt: toDate(source.createdAt),
    status: normalizeReportStatus(source.status),
  }
}

const mapMeta = (value: unknown): ApiMeta => {
  const source = isRecord(value) ? value : {}
  const total = asNumber(source.total)
  const page = asNumber(source.page, 1)
  const limit = asNumber(source.limit, 20)
  const totalPages = asNumber(source.totalPages, Math.ceil(total / Math.max(limit, 1)))
  return { total, page, limit, totalPages }
}

const mapPaginatedProducts = (value: unknown): PaginatedResponse<Product> => {
  if (!isRecord(value)) {
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    }
  }
  return {
    data: Array.isArray(value.data) ? value.data.map(mapProduct) : [],
    meta: mapMeta(value.meta),
  }
}

const parseJsonResponse = (raw: string): unknown => {
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return raw
  }
}

const getErrorMessage = (status: number, data: unknown) => {
  if (isRecord(data)) {
    const message = data.message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
    if (Array.isArray(message) && message.length > 0 && typeof message[0] === 'string') {
      return message[0]
    }
  }
  return `Request failed with status ${status}`
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { json, formData, auth = true, headers, ...rest } = options
  const token = auth ? getAccessToken() : null

  const mergedHeaders = new Headers(headers ?? {})
  if (json !== undefined) {
    mergedHeaders.set('Content-Type', 'application/json')
  }
  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: mergedHeaders,
    body: json !== undefined ? JSON.stringify(json) : formData,
  })

  const raw = await response.text()
  const data = parseJsonResponse(raw)

  if (!response.ok) {
    throw new ApiError(getErrorMessage(response.status, data), response.status, data)
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

export const usersApi = {
  list() {
    return apiRequest<unknown[]>('/users').then((items) => items.map(mapUser))
  },
  me() {
    return apiRequest<unknown>('/users/me').then(mapUser)
  },
  updateMe(payload: UserUpdatePayload) {
    return apiRequest<unknown>('/users/me', {
      method: 'PATCH',
      json: payload,
    }).then(mapUser)
  },
  myListings(query?: Record<string, string | number | undefined>) {
    return apiRequest<unknown>(`/users/me/listings${toQueryString(query)}`).then(mapPaginatedProducts)
  },
  mySavedListings(query?: Record<string, string | number | undefined>) {
    return apiRequest<unknown>(`/users/me/saved-listings${toQueryString(query)}`).then(mapPaginatedProducts)
  },
}

export const categoriesApi = {
  list() {
    return apiRequest<CategoryItem[]>('/categories')
  },
}

export const listingsApi = {
  list(query?: Record<string, string | number | undefined>) {
    return apiRequest<unknown>(`/listings${toQueryString(query)}`).then(mapPaginatedProducts)
  },
  byId(id: string) {
    return apiRequest<unknown>(`/listings/${id}`).then(mapProduct)
  },
  bySeller(sellerId: string, query?: Record<string, string | number | undefined>) {
    return apiRequest<unknown>(`/listings/seller/${sellerId}${toQueryString(query)}`).then(mapPaginatedProducts)
  },
  create(payload: ListingWritePayload) {
    return apiRequest<unknown>('/listings', {
      method: 'POST',
      json: payload,
    }).then(mapProduct)
  },
  update(id: string, payload: ListingUpdatePayload) {
    return apiRequest<unknown>(`/listings/${id}`, {
      method: 'PATCH',
      json: payload,
    }).then(mapProduct)
  },
  remove(id: string) {
    return apiRequest<{ message: string }>(`/listings/${id}`, {
      method: 'DELETE',
    })
  },
  updateStatus(id: string, status: ProductStatus) {
    return apiRequest<unknown>(`/listings/${id}/status`, {
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

export const uploadsApi = {
  uploadImages(files: File[]) {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    return apiRequest<{ data: UploadedImage[] }>('/uploads/images', {
      method: 'POST',
      formData,
    })
  },
  uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return apiRequest<{ data: UploadedImage }>('/uploads/avatar', {
      method: 'POST',
      formData,
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
    return apiRequest<{ id: string; status: string }>('/reports', {
      method: 'POST',
      json: payload,
    })
  },
}

export const conversationsApi = {
  list() {
    return apiRequest<unknown[]>('/conversations').then((items) => items.map(mapConversation))
  },
  create(payload: { participantId: string; productId?: string }) {
    return apiRequest<unknown>('/conversations', {
      method: 'POST',
      json: payload,
    }).then(mapConversation)
  },
  messages(conversationId: string, query?: Record<string, string | number | undefined>) {
    return apiRequest<{ data: unknown[]; meta: unknown }>(
      `/conversations/${conversationId}/messages${toQueryString(query)}`,
    ).then((result) => ({
      data: result.data.map(mapMessage),
      meta: mapMeta(result.meta),
    }))
  },
  sendMessage(
    conversationId: string,
    payload: { content?: string; imageUrl?: string; type?: 'text' | 'image' },
  ) {
    return apiRequest<unknown>(`/conversations/${conversationId}/messages`, {
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
    return apiRequest<unknown[]>('/admin/listings/pending').then((items) => items.map(mapProduct))
  },
  approveListing(id: string) {
    return apiRequest<{ message: string }>(`/admin/listings/${id}/approve`, { method: 'POST' })
  },
  rejectListing(id: string) {
    return apiRequest<{ message: string }>(`/admin/listings/${id}/reject`, { method: 'POST' })
  },
  reports(status?: string) {
    return apiRequest<unknown[]>(`/admin/reports${toQueryString({ status })}`).then((items) => items.map(mapReport))
  },
  resolveReport(id: string) {
    return apiRequest<{ message: string }>(`/admin/reports/${id}/resolve`, { method: 'POST' })
  },
  dismissReport(id: string) {
    return apiRequest<{ message: string }>(`/admin/reports/${id}/dismiss`, { method: 'POST' })
  },
}
