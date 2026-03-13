'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { reportsApi } from '@/lib/api'
import { reportFormSchema, type ReportFormValues } from '@/lib/validation/schemas'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { FieldError } from '@/shared/ui/field-error'
import { Textarea } from '@/shared/ui/textarea'

type ReportDialogProps = {
  open: boolean
  listingId: string
  onOpenChange: (open: boolean) => void
}

const REASON_OPTIONS = [
  'Hang gia / khong dung mo ta',
  'Gia cao / lua dao',
  'Noi dung khong phu hop',
  'Spam / quang cao',
  'Khac',
] as const

export function ReportDialog({ open, listingId, onOpenChange }: ReportDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      selectedReason: 'Hang gia / khong dung mo ta',
      otherReason: '',
    },
  })
  const selectedReason = form.watch('selectedReason')

  const handleSubmit = form.handleSubmit(async (values) => {
    const normalizedReason =
      values.selectedReason === 'Khac' ? values.otherReason.trim() : values.selectedReason
    setSubmitting(true)
    try {
      await reportsApi.create({
        listingId,
        reason: normalizedReason,
      })
      toast.success('Da gui bao cao')
      onOpenChange(false)
      form.reset({
        selectedReason: 'Hang gia / khong dung mo ta',
        otherReason: '',
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong gui duoc bao cao')
    } finally {
      setSubmitting(false)
    }
  })

  const reasonError =
    form.formState.submitCount > 0 || form.formState.touchedFields.otherReason
      ? form.formState.errors.otherReason?.message
      : undefined

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) {
          form.reset({
            selectedReason: 'Hang gia / khong dung mo ta',
            otherReason: '',
          })
        }
      }}
    >
      <AlertDialogContent>
        <form onSubmit={handleSubmit} noValidate>
          <AlertDialogHeader>
            <AlertDialogTitle>Bao cao bai dang</AlertDialogTitle>
            <AlertDialogDescription>
              Chon ly do phu hop nhat de admin xem xet nhanh hon.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4 space-y-2">
            {REASON_OPTIONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => {
                  form.setValue('selectedReason', reason, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }}
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                  selectedReason === reason
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/40',
                )}
              >
                {reason}
              </button>
            ))}
          </div>

          {selectedReason === 'Khac' ? (
            <div className="mt-3 space-y-2">
              <Textarea
                {...form.register('otherReason')}
                maxLength={500}
                rows={4}
                placeholder="Mo ta ly do bao cao (toi da 500 ky tu)"
                aria-invalid={Boolean(reasonError)}
              />
              <FieldError message={reasonError} />
            </div>
          ) : null}

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel type="button" disabled={submitting}>Huy</AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={submitting}>
              {submitting ? 'Dang gui...' : 'Gui bao cao'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
