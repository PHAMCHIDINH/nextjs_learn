const DEFAULT_LOCAL_API_BASE_URL = 'http://localhost:3000'
const DEFAULT_PRODUCTION_API_BASE_URL = 'https://api.chonttu.shop'

type UnknownRecord = Record<string, unknown>

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  json?: unknown
  formData?: FormData
  auth?: boolean
}

export type ApiMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type ApiQueryPrimitive = string | number | boolean
export type ApiQueryValue = ApiQueryPrimitive | ApiQueryPrimitive[] | undefined | null

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

export const toQueryString = (query?: Record<string, ApiQueryValue>) => {
  if (!query) {
    return ''
  }

  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    if (Array.isArray(value)) {
      value
        .filter((item) => item !== undefined && item !== null && item !== '')
        .forEach((item) => {
          params.append(key, String(item))
        })
      return
    }

    params.set(key, String(value))
  })

  const text = params.toString()
  return text ? `?${text}` : ''
}

export const getApiBaseUrl = () => {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined' && window.location.hostname.endsWith('chonttu.shop')) {
    return DEFAULT_PRODUCTION_API_BASE_URL
  }

  return DEFAULT_LOCAL_API_BASE_URL
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { json, formData, headers, ...rest } = options
  const mergedHeaders = new Headers(headers ?? {})
  if (json !== undefined) {
    mergedHeaders.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
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
