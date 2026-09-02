/**
 * Slider — depth / time range controls for ocean data
 */
import { cn } from '@/utils/cn'
import type { InputHTMLAttributes } from 'react'

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  valueLabel?: string
  unit?: string
}

export function Slider({ label, valueLabel, unit, className, id, ...props }: SliderProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label ?? valueLabel) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={id}
              className="text-xs font-medium text-[var(--color-text-secondary)]"
            >
              {label}
            </label>
          )}
          {valueLabel && (
            <span className="font-mono text-xs text-[var(--color-accent-400)]">
              {valueLabel}
              {unit && <span className="ml-0.5 text-[var(--color-text-muted)]">{unit}</span>}
            </span>
          )}
        </div>
      )}
      <input
        id={id}
        type="range"
        className={cn(
          'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-surface-overlay)]',
          '[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-[var(--color-accent-400)] [&::-webkit-slider-thumb]:shadow-md',
          '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125'
        )}
        {...props}
      />
    </div>
  )
}
