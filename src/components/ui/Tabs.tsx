/**
 * Tabs — horizontal tab group
 */
import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

export interface Tab {
  id: string
  label: string
  icon?: ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-0.5 rounded-lg bg-[var(--color-surface-overlay)] p-1',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          className={cn(
            'inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150',
            activeTab === tab.id
              ? 'bg-[var(--color-surface-popover)] text-[var(--color-accent-400)] shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
            tab.disabled && 'cursor-not-allowed opacity-40'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
