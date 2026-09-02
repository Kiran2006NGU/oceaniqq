/**
 * ResidualChart.tsx — Diverging Residual (Model − Observed) Chart
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Shows residual (M − O) against depth or observation points with a diverging zero baseline:
 * - Negative residual (Blue/Amber) = Model underpredicts (Observation > Model)
 * - Positive residual (Cyan/Red) = Model overpredicts (Model > Observation)
 */

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import type { ResidualPoint } from '@/types/comparison'

interface ResidualChartProps {
  data: ResidualPoint[]
  variable: string
  unit: string
}

export function ResidualChart({ data, unit }: ResidualChartProps) {
  const chartData = useMemo(() => {
    return [...data].sort((a, b) => a.depth - b.depth)
  }, [data])

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 font-mono text-xs">
        <span>No residual data points to display.</span>
      </div>
    )
  }

  const maxAbsRes = Math.max(...chartData.map((d) => Math.abs(d.residual)), 0.5)
  const yLimit = Math.ceil(maxAbsRes * 1.2 * 10) / 10

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/5 text-[11px] font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-cyan-400">
            ▲ Positive: <strong className="text-white">Model Overforecast</strong>
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            ▼ Negative: <strong className="text-white">Model Underforecast</strong>
          </span>
        </div>
        <span className="text-slate-400 text-[10px]">
          Residual Scale: <strong className="text-white">±{yLimit} {unit}</strong>
        </span>
      </div>

      <div className="flex-1 min-h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 24, bottom: 20, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="depth"
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'Calibri, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(v: number) => `${v}m`}
              label={{
                value: 'DEPTH LEVEL (m) →',
                position: 'insideBottom',
                offset: -10,
                style: { fontSize: 10, fill: '#94a3b8', fontFamily: 'Calibri, sans-serif' },
              }}
            />
            <YAxis
              domain={[-yLimit, yLimit]}
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'Calibri, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(v: number) => (v > 0 ? `+${v}` : `${v}`)}
              width={42}
              label={{
                value: `RESIDUAL (${unit})`,
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: '#94a3b8', fontFamily: 'Calibri, sans-serif' },
              }}
            />
            <ReferenceLine y={0} stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="2 2" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const d = payload[0]?.payload as ResidualPoint
                return (
                  <div className="p-2.5 rounded-xl bg-[#020b18]/95 border border-cyan-500/40 shadow-2xl font-mono text-xs space-y-1">
                    <div className="text-[11px] font-bold text-slate-300 border-b border-white/10 pb-1 flex justify-between">
                      <span>Depth: {d.depth} m</span>
                      <span className="text-[10px] text-slate-400">{d.id}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-slate-300">
                      <span>Model Value:</span>
                      <span className="font-bold text-cyan-300">{d.model_value} {unit}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-slate-300">
                      <span>Observed Value:</span>
                      <span className="font-bold text-emerald-300">{d.obs_value} {unit}</span>
                    </div>
                    <div className="flex justify-between gap-4 pt-1 border-t border-white/10">
                      <span className="text-slate-400 font-bold">Residual (M − O):</span>
                      <span className={d.residual >= 0 ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>
                        {d.residual > 0 ? `+${d.residual}` : d.residual} {unit}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-[10px] text-slate-400">
                      <span>Absolute Error:</span>
                      <span>{d.absolute_error} {unit}</span>
                    </div>
                  </div>
                )
              }}
            />
            <Bar dataKey="residual" name="Residual" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.residual >= 0 ? '#06b6d4' : '#f59e0b'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
