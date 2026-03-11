'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { reportsApi } from '@/lib/api'
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
  const [selectedReason, setSelectedReason] = useState<(typeof REASON_OPTIONS)[number]>('Hang gia / khong dung mo ta')
  const [otherReason, setOtherReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const normalizedReason = useMemo(() => {
    if (selectedReason !== 'Khac') {
      return selectedReason
    }

    return otherReason.trim()
  }, [otherReason, selectedReason])

  const handleSubmit = async () => {
    if (!normalizedReason || normalizedReason.length < 5) {
      toast.error('Vui long mo ta ly do bao cao')
      return
    }

    setSubmitting(true)
    try {
      await reportsApi.create({
        listingId,
        reason: normalizedReason,
      })
      toast.success('Da gui bao cao')
      onOpenChange(false)
      setSelectedReason('Hang gia / khong dung mo ta')
      setOtherReason('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong gui duoc bao cao')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bao cao bai dang</AlertDialogTitle>
          <AlertDialogDescription>
            Chon ly do phu hop nhat de admin xem xet nhanh hon.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          {REASON_OPTIONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelectedReason(reason)}
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
          <Textarea
            value={otherReason}
            onChange={(event) => setOtherReason(event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Mo ta ly do bao cao (toi da 500 ky tu)"
          />
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Huy</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              void handleSubmit()
            }}
            disabled={submitting}
          >
            {submitting ? 'Dang gui...' : 'Gui bao cao'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
