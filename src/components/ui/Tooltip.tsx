/**
 * Tooltip — hover tooltip for data labels and controls
 */
import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'
import { useState } from 'react'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

const sideStyles = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 max-w-xs rounded-md border border-[var(--color-border)] bg-[var(--color-surface-popover)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] shadow-xl',
            'animate-fade-in-up whitespace-nowrap',
            sideStyles[side]
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
