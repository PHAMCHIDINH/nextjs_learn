export type ProductStatus = 'selling' | 'reserved' | 'sold'

export type Category = 'textbook' | 'electronics' | 'dorm' | 'study' | 'other'

export type Condition = 'new' | 'like-new' | 'good' | 'fair'

export type Department = 'cntt' | 'kinhtoe' | 'marketing' | 'ngoaingu' | 'luat' | 'quanly' | 'kythuat'

export interface User {
  id: string
  name: string
  email: string
  studentId: string
  department: Department
  avatar?: string
  verified: boolean
  createdAt: Date
  lastSeen?: Date
  online?: boolean
  role?: 'user' | 'admin'
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: Category
  condition: Condition
  status: ProductStatus
  seller: User
  department: Department
  createdAt: Date
  updatedAt: Date
  views: number
  savedBy: string[]
  isSaved?: boolean
  approvalStatus?: 'pending' | 'approved' | 'rejected'
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  type: 'text' | 'image'
  imageUrl?: string
  createdAt: Date
  read: boolean
  productId?: string
}

export interface Conversation {
  id: string
  participants: User[]
  lastMessage?: Message
  product?: Product
  unreadCount: number
  updatedAt: Date
}

export interface Report {
  id: string
  productId: string
  product: Product
  reason: string
  reportedBy: User
  createdAt: Date
  status: 'pending' | 'reviewed' | 'resolved'
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface CategoryItem {
  id: string
  key: Category
  name: string
  icon?: string
  count: number
}

export interface DashboardSummary {
  myPosts: number
  selling: number
  saved: number
  conversations: number
  totalViews: number
}

export interface UploadedImage {
  url: string
  publicId: string
}

export const categoryLabels: Record<Category, string> = {
  textbook: 'Giáo trình',
  electronics: 'Điện tử',
  dorm: 'Đồ phòng trọ',
  study: 'Dụng cụ học tập',
  other: 'Khác',
}

export const conditionLabels: Record<Condition, string> = {
  new: 'Mới 100%',
  'like-new': 'Như mới',
  good: 'Tốt',
  fair: 'Khá',
}

export const statusLabels: Record<ProductStatus, string> = {
  selling: 'Đang bán',
  reserved: 'Đã có người cọc',
  sold: 'Đã bán',
}

export const departmentLabels: Record<Department, string> = {
  cntt: 'Công nghệ thông tin',
  kinhtoe: 'Kinh tế',
  marketing: 'Marketing',
  ngoaingu: 'Ngôn ngữ Anh',
  luat: 'Luật',
  quanly: 'Quản lý',
  kythuat: 'Kỹ thuật',
}
