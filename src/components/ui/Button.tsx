/**
 * Button — Ocean Intelligence Platform UI component
 */
import { cn } from '@/utils/cn'
import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent-500)] text-[var(--color-surface-base)] hover:bg-[var(--color-accent-400)] shadow-lg shadow-[rgba(0,180,216,0.2)]',
  secondary:
    'bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-popover)] hover:border-[var(--color-accent-500)]',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]',
  danger:
    'bg-[var(--color-error)] text-white hover:opacity-90 shadow-lg shadow-[rgba(248,113,113,0.2)]',
  outline:
    'bg-transparent border border-[var(--color-accent-500)] text-[var(--color-accent-400)] hover:bg-[rgba(0,180,216,0.08)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2.5',
  icon: 'h-9 w-9 p-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'secondary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled ?? loading}
        aria-disabled={disabled ?? loading}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-accent-400)] disabled:cursor-not-allowed disabled:opacity-40',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span
            className="spinner h-4 w-4 rounded-full border-2 border-current border-t-transparent"
            role="status"
            aria-label="Loading"
          />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
