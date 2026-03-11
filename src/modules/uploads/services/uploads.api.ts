import type { UploadedImage } from '@/lib/types'
import { apiRequest } from '@/core/api/http'

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
