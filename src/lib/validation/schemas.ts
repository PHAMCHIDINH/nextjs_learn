import { z } from 'zod'
import type { Category, Condition, Department, ProductStatus } from '@/lib/types'

export const INT32_MAX = 2_147_483_647
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_LISTING_IMAGE_COUNT = 5

const categoryValues = ['textbook', 'electronics', 'dorm', 'study', 'other'] as const satisfies readonly Category[]
const conditionValues = ['new', 'like-new', 'good', 'fair'] as const satisfies readonly Condition[]
const departmentValues = ['cntt', 'kinhtoe', 'marketing', 'ngoaingu', 'luat', 'quanly', 'kythuat'] as const satisfies readonly Department[]
const statusValues = ['selling', 'reserved', 'sold'] as const satisfies readonly ProductStatus[]

const requiredCategorySchema = z
  .union([z.enum(categoryValues), z.literal('')])
  .refine((value) => value !== '', 'Vui lòng chọn danh mục')

const requiredConditionSchema = z
  .union([z.enum(conditionValues), z.literal('')])
  .refine((value) => value !== '', 'Vui lòng chọn tình trạng')

const requiredDepartmentSchema = z
  .union([z.enum(departmentValues), z.literal('')])
  .refine((value) => value !== '', 'Vui lòng chọn ngành học liên quan')

const requiredText = (label: string) => z.string().trim().min(1, `${label} không được để trống`)

const positiveIntString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} không được để trống`)
    .refine((value) => /^\d+$/.test(value), `${label} phải là số hợp lệ`)
    .refine((value) => Number(value) > 0, `${label} phải lớn hơn 0`)
    .refine((value) => Number(value) <= INT32_MAX, `${label} vượt quá giới hạn cho phép`)

const optionalIntString = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), `${label} phải là số hợp lệ`)
    .refine((value) => value === '' || Number(value) <= INT32_MAX, `${label} vượt quá giới hạn cho phép`)

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email không được để trống').email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
})

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Họ và tên cần ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự'),
  studentId: z
    .string()
    .trim()
    .min(1, 'Mã số sinh viên không được để trống')
    .max(30, 'Mã số sinh viên không được vượt quá 30 ký tự'),
  department: z.enum(departmentValues, { error: 'Vui lòng chọn khoa / ngành' }),
  email: z.string().trim().min(1, 'Email không được để trống').email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
})

export const otpSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Vui lòng nhập đủ 6 số OTP'),
})

export const listingFormSchema = z.object({
  title: requiredText('Tiêu đề bài đăng').max(150, 'Tiêu đề bài đăng không được vượt quá 150 ký tự'),
  description: requiredText('Mô tả').max(2000, 'Mô tả không được vượt quá 2000 ký tự'),
  price: positiveIntString('Giá bán'),
  originalPrice: optionalIntString('Giá gốc'),
  category: requiredCategorySchema,
  condition: requiredConditionSchema,
  department: requiredDepartmentSchema,
})

const reportReasonValues = [
  'Hang gia / khong dung mo ta',
  'Gia cao / lua dao',
  'Noi dung khong phu hop',
  'Spam / quang cao',
  'Khac',
] as const

export const reportFormSchema = z
  .object({
    selectedReason: z.enum(reportReasonValues),
    otherReason: z.string().trim().max(500, 'Lý do báo cáo không được vượt quá 500 ký tự'),
  })
  .superRefine((value, ctx) => {
    if (value.selectedReason === 'Khac' && value.otherReason.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng mô tả lý do báo cáo',
        path: ['otherReason'],
      })
    }
  })

export const profileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Tên cần ít nhất 2 ký tự')
    .max(100, 'Tên không được vượt quá 100 ký tự'),
  department: z.enum(departmentValues, { error: 'Vui lòng chọn ngành học' }),
})

export const marketplaceFilterSchema = z.object({
  search: z.string().trim(),
  sortBy: z.enum(['newest', 'oldest', 'price-asc', 'price-desc', 'popular']),
  priceRange: z
    .tuple([z.number().min(0), z.number().min(0)])
    .refine(([minPrice, maxPrice]) => minPrice <= maxPrice, 'Khoảng giá không hợp lệ'),
  selectedCategories: z.array(z.enum(categoryValues)),
  selectedConditions: z.array(z.enum(conditionValues)),
  selectedDepartments: z.array(z.enum(departmentValues)),
  selectedStatuses: z.array(z.enum(statusValues)),
})

const imageFileSchema = z.custom<File>((value) => value instanceof File, {
  message: 'Tệp tải lên không hợp lệ',
})

export const avatarFileSchema = imageFileSchema.superRefine((file, ctx) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Avatar chỉ hỗ trợ JPG, PNG, WEBP',
    })
  }

  if (file.size > MAX_IMAGE_SIZE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Avatar tối đa 5MB',
    })
  }
})

export const listingUploadFilesSchema = z
  .array(imageFileSchema)
  .min(1, 'Không có file nào được chọn')
  .max(MAX_LISTING_IMAGE_COUNT, `Tối đa ${MAX_LISTING_IMAGE_COUNT} ảnh`)
  .superRefine((files, ctx) => {
    const invalidType = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]))
    if (invalidType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Chỉ chấp nhận JPG, PNG, WEBP',
      })
    }

    const oversize = files.find((file) => file.size > MAX_IMAGE_SIZE)
    if (oversize) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mỗi ảnh tối đa 5MB',
      })
    }
  })

export const chatImageFileSchema = imageFileSchema.superRefine((file, ctx) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Chỉ chấp nhận JPG, PNG, WEBP',
    })
  }

  if (file.size > MAX_IMAGE_SIZE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Mỗi ảnh tối đa 5MB',
    })
  }
})

export const chatComposerSchema = z
  .object({
    message: z.string().trim().max(5000, 'Tin nhắn không được vượt quá 5000 ký tự'),
    imageFile: chatImageFileSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.message.trim() && !value.imageFile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng nhập tin nhắn hoặc chọn ảnh',
        path: ['message'],
      })
    }
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type OtpFormValues = z.infer<typeof otpSchema>
export type ListingFormSchemaInputValues = z.input<typeof listingFormSchema>
export type ListingFormSchemaValues = z.output<typeof listingFormSchema>
export type ReportFormValues = z.infer<typeof reportFormSchema>
export type ProfileFormValues = z.infer<typeof profileFormSchema>
export type MarketplaceFilterFormValues = z.infer<typeof marketplaceFilterSchema>
export type ChatComposerFormValues = z.infer<typeof chatComposerSchema>
