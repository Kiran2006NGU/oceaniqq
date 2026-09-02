/**
 * AquaVisPage.tsx — Legacy 3D Visualization from sih aqua vis
 * Route: /aqua-vis
 */
// @ts-ignore
import OceanScene from '@/components/aqua-vis/OceanScene.jsx'

export function AquaVisPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden animate-fade-in-up" style={{ height: 'calc(100dvh - 56px)' }}>
      {/* Header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">Legacy 3D Visualizer</h1>
          <span className="text-xs text-[var(--color-text-muted)]">(sih aqua vis)</span>
        </div>
      </div>
      
      {/* Main visualization area */}
      <div className="flex-1 relative bg-black">
        <OceanScene />
      </div>
    </div>
  )
}
