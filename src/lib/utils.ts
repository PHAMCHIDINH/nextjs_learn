import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return vndFormatter.format(price)
}

export function formatPriceCompact(price: number) {
  if (price >= 1_000_000) {
    const millions = price / 1_000_000
    const value = Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)
    return `${value}tr`
  }

  if (price >= 1_000) {
    return `${Math.round(price / 1_000)}k`
  }

  return `${price}`
}
