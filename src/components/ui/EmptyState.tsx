/**
 * EmptyState — placeholder when no data is available
 */
import { cn } from '@/utils/cn'
import { Database } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      <div className="rounded-full bg-[var(--color-surface-overlay)] p-4 text-[var(--color-text-muted)]">
        {icon ?? <Database className="h-6 w-6" aria-hidden />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
        {description && (
          <p className="max-w-xs text-xs text-[var(--color-text-muted)]">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
