/**
 * ErrorState — error boundary display and API error feedback
 */
import { cn } from '@/utils/cn'
import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

interface ErrorStateProps {
  title?: string
  message?: string
  action?: ReactNode
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      <div className="rounded-full bg-[rgba(248,113,113,0.12)] p-4 text-[var(--color-error)]">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
        {message && (
          <p className="max-w-xs text-xs text-[var(--color-text-muted)]">{message}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
