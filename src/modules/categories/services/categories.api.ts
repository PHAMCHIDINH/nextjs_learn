import type { CategoryItem } from '@/lib/types'
import { apiRequest } from '@/core/api/http'

export const categoriesApi = {
  list() {
    return apiRequest<CategoryItem[]>('/categories')
  },
}
