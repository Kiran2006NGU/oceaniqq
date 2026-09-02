/**
 * Card — Ocean Intelligence Platform UI component
 */
import { cn } from '@/utils/cn'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'raised' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variantStyles = {
  default: 'bg-[var(--color-surface-raised)] border border-[var(--color-border)]',
  raised: 'bg-[var(--color-surface-overlay)] border border-[var(--color-border)]',
  glass: 'glass',
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({ variant = 'default', padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-xl transition-all duration-200', variantStyles[variant], paddingStyles[padding], className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-3 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('text-[var(--color-text-secondary)]', className)} {...props}>
      {children}
    </div>
  )
}
