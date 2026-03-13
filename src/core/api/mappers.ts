import type {
  Category,
  Condition,
  Conversation,
  Department,
  Message,
  Notification,
  PaginatedResponse,
  Product,
  ProductStatus,
  PublicUserProfile,
  Report,
  User,
} from '@/lib/types'
import type { ApiMeta } from '@/core/api/http'

type UnknownRecord = Record<string, unknown>

const CATEGORIES: Category[] = ['textbook', 'electronics', 'dorm', 'study', 'other']
const CONDITIONS: Condition[] = ['new', 'like-new', 'good', 'fair']
const STATUSES: ProductStatus[] = ['selling', 'reserved', 'sold']
const DEPARTMENTS: Department[] = ['cntt', 'kinhtoe', 'marketing', 'ngoaingu', 'luat', 'quanly', 'kythuat']
const REPORT_STATUSES: Array<Report['status']> = ['pending', 'reviewed', 'resolved']
const MESSAGE_TYPES: Array<Message['type']> = ['text', 'image']
const NOTIFICATION_TYPES: Array<Notification['type']> = [
  'NEW_MESSAGE',
  'LISTING_APPROVED',
  'LISTING_REJECTED',
  'NEW_REVIEW',
]
const USER_ROLES: Array<NonNullable<User['role']>> = ['user', 'admin']

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

const normalizeDepartmentOptional = (value: unknown): Department | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  return (DEPARTMENTS as readonly string[]).includes(value) ? (value as Department) : undefined
}

const normalizeRole = (value: unknown): User['role'] =>
  normalizeEnum(value, USER_ROLES, 'user')

const normalizeMessageType = (value: unknown): Message['type'] =>
  normalizeEnum(value, MESSAGE_TYPES, 'text')

const normalizeNotificationType = (value: unknown): Notification['type'] =>
  normalizeEnum(value, NOTIFICATION_TYPES, 'NEW_MESSAGE')

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

export const mapUser = (value: unknown): User => {
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

export const mapPublicUserProfile = (value: unknown): PublicUserProfile => {
  const source = isRecord(value) ? value : {}
  return {
    id: asString(source.id),
    name: asString(source.name),
    avatar: typeof source.avatar === 'string' ? source.avatar : undefined,
    department: normalizeDepartmentOptional(source.department),
    studentId: asString(source.studentId),
    isVerified: asBoolean(source.isVerified),
    sellerRating: asNumber(source.sellerRating),
    totalReviews: asNumber(source.totalReviews),
    createdAt: toDate(source.createdAt),
  }
}

export const mapProduct = (value: unknown): Product => {
  const source = isRecord(value) ? value : {}
  const images = Array.isArray(source.images) ? source.images.filter((item): item is string => typeof item === 'string') : []
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
    savedCount: asNumber(source.savedCount),
    isSaved: source.isSaved === undefined ? undefined : asBoolean(source.isSaved),
    approvalStatus:
      source.approvalStatus === 'pending' || source.approvalStatus === 'approved' || source.approvalStatus === 'rejected'
        ? source.approvalStatus
        : undefined,
  }
}

export const mapMessage = (value: unknown): Message => {
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

export const mapConversation = (value: unknown): Conversation => {
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

export const mapNotification = (value: unknown): Notification => {
  const source = isRecord(value) ? value : {}
  return {
    id: asString(source.id),
    type: normalizeNotificationType(source.type),
    title: asString(source.title),
    body: asString(source.body),
    isRead: asBoolean(source.isRead),
    metadata: isRecord(source.metadata) ? source.metadata : undefined,
    createdAt: toDate(source.createdAt),
  }
}

export const mapReport = (value: unknown): Report => {
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

export const mapMeta = (value: unknown): ApiMeta => {
  const source = isRecord(value) ? value : {}
  const total = asNumber(source.total)
  const page = asNumber(source.page, 1)
  const limit = asNumber(source.limit, 20)
  const totalPages = asNumber(source.totalPages, Math.ceil(total / Math.max(limit, 1)))
  return { total, page, limit, totalPages }
}

export const mapPaginatedProducts = (value: unknown): PaginatedResponse<Product> => {
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

export const mapPaginatedReports = (value: unknown): PaginatedResponse<Report> => {
  if (!isRecord(value)) {
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    }
  }

  return {
    data: Array.isArray(value.data) ? value.data.map(mapReport) : [],
    meta: mapMeta(value.meta),
  }
}
