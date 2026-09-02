/**
 * LoadingIndicator — spinners and skeleton loaders
 */
import { cn } from '@/utils/cn'
import { Waves } from 'lucide-react'

interface LoadingIndicatorProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'pulse' | 'full'
  className?: string
}

const sizeStyles = {
  sm: { icon: 'h-4 w-4', text: 'text-xs' },
  md: { icon: 'h-6 w-6', text: 'text-sm' },
  lg: { icon: 'h-10 w-10', text: 'text-base' },
}

export function LoadingIndicator({
  message = 'Loading...',
  size = 'md',
  variant = 'spinner',
  className,
}: LoadingIndicatorProps) {
  const { icon, text } = sizeStyles[size]

  if (variant === 'pulse') {
    return (
      <div className={cn('animate-pulse space-y-2', className)}>
        <div className="h-4 rounded bg-[var(--color-surface-overlay)]" />
        <div className="h-4 w-3/4 rounded bg-[var(--color-surface-overlay)]" />
        <div className="h-4 w-1/2 rounded bg-[var(--color-surface-overlay)]" />
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 py-16',
          className
        )}
      >
        <Waves className={cn(icon, 'spinner text-[var(--color-accent-400)]')} aria-hidden />
        <p className={cn(text, 'text-[var(--color-text-muted)]')}>{message}</p>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)} role="status" aria-label={message}>
      <span
        className={cn(
          icon,
          'spinner rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent-400)]'
        )}
      />
      {message && (
        <span className={cn(text, 'text-[var(--color-text-muted)]')}>{message}</span>
      )}
    </div>
  )
}
