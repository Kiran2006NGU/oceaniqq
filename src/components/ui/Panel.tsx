/**
 * Panel — collapsible side/overlay panel for scientific controls
 */
import { cn } from '@/utils/cn'
import type { HTMLAttributes } from 'react'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  noPad?: boolean
}

export function Panel({ title, subtitle, actions, noPad, className, children, ...props }: PanelProps) {
  return (
    <div
      className={cn('glass rounded-xl', noPad ? '' : 'p-4', className)}
      {...props}
    >
      {(title ?? actions) && (
        <div className="mb-3 flex items-start justify-between">
          <div>
            {title && (
              <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">
                {title}
              </h4>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
