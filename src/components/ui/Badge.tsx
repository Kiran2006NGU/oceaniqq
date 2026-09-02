/**
 * Badge — status and label badges
 */
import { cn } from '@/utils/cn'
import type { HTMLAttributes } from 'react'

export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'outline'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
  accent: 'bg-[rgba(0,180,216,0.15)] text-[var(--color-accent-400)] border border-[rgba(0,180,216,0.3)]',
  success: 'bg-[rgba(34,211,160,0.12)] text-[var(--color-success)] border border-[rgba(34,211,160,0.3)]',
  warning: 'bg-[rgba(245,158,11,0.12)] text-[var(--color-warning)] border border-[rgba(245,158,11,0.3)]',
  error: 'bg-[rgba(248,113,113,0.12)] text-[var(--color-error)] border border-[rgba(248,113,113,0.3)]',
  info: 'bg-[rgba(56,189,248,0.12)] text-[var(--color-info)] border border-[rgba(56,189,248,0.3)]',
  outline: 'bg-transparent text-[var(--color-text-secondary)] border border-[var(--color-border)]',
}

export function Badge({ variant = 'default', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
