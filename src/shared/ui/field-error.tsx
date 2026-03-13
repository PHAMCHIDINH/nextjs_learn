import { cn } from '@/lib/utils'

type FieldErrorProps = {
  message?: string
  className?: string
}

export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) {
    return null
  }

  return (
    <p role="alert" className={cn('text-xs text-destructive', className)}>
      {message}
    </p>
  )
}
