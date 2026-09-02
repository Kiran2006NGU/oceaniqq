/**
 * ComparisonProfileChart.tsx — Model vs In-Situ Vertical Profile Chart
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * X-axis = Variable value (Temperature °C, Salinity PSU, Chlorophyll mg/m³)
 * Y-axis = Depth (m), inverted (0m surface at top, 2000m at bottom)
 * Model = Cyan line
 * Observation = Emerald points / line
 */

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { ProfilePointPair } from '@/types/comparison'

interface ComparisonProfileChartProps {
  data: ProfilePointPair[]
  variable: string
  unit: string
  modelName?: string
  obsName?: string
}

export function ComparisonProfileChart({
  data,
  variable,
  unit,
  modelName = 'Numerical Model',
  obsName = 'In-Situ Observation',
}: ComparisonProfileChartProps) {
  const chartData = useMemo(() => {
    return [...data].sort((a, b) => a.depth - b.depth)
  }, [data])

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 font-mono text-xs">
        <span>No vertical profile points available for comparison.</span>
      </div>
    )
  }

  // Calculate X-axis domain with padding
  const allVals = chartData.flatMap((d) => [d.model_value, d.obs_value]).filter((v) => v !== null && !isNaN(v))
  const minVal = allVals.length > 0 ? Math.floor(Math.min(...allVals) * 0.95 * 10) / 10 : 0
  const maxVal = allVals.length > 0 ? Math.ceil(Math.max(...allVals) * 1.05 * 10) / 10 : 35

  const maxDepth = Math.max(...chartData.map((d) => d.depth), 100)

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/5 text-[11px] font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
            {modelName} (Prediction)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            {obsName} (Ground Truth)
          </span>
        </div>
        <span className="text-slate-400 text-[10px]">
          Variable: <strong className="text-white capitalize">{variable}</strong> ({unit})
        </span>
      </div>

      <div className="flex-1 min-h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 24, bottom: 20, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis
              type="number"
              domain={[minVal, maxVal]}
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'Calibri, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              label={{
                value: `${variable.toUpperCase()} (${unit})`,
                position: 'insideBottom',
                offset: -10,
                style: { fontSize: 10, fill: '#94a3b8', fontFamily: 'Calibri, sans-serif' },
              }}
            />
            <YAxis
              type="number"
              dataKey="depth"
              reversed
              domain={[0, maxDepth]}
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'Calibri, sans-serif' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(v: number) => `${v}m`}
              width={42}
              label={{
                value: 'DEPTH (m) ↓',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: '#94a3b8', fontFamily: 'Calibri, sans-serif' },
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null
                const d = payload[0]?.payload as ProfilePointPair
                return (
                  <div className="p-2.5 rounded-xl bg-[#020b18]/95 border border-cyan-500/40 shadow-2xl font-mono text-xs space-y-1">
                    <div className="text-[11px] font-bold text-slate-300 border-b border-white/10 pb-1">
                      Depth: <span className="text-cyan-300">{label} m</span>
                    </div>
                    <div className="flex justify-between gap-4 text-cyan-300">
                      <span>Model Value:</span>
                      <span className="font-bold">{d.model_value} {unit}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-emerald-300">
                      <span>Observed Value:</span>
                      <span className="font-bold">{d.obs_value} {unit}</span>
                    </div>
                    <div className="flex justify-between gap-4 pt-1 border-t border-white/10">
                      <span className="text-slate-400">Residual (M − O):</span>
                      <span className={d.residual >= 0 ? 'text-amber-400 font-bold' : 'text-blue-400 font-bold'}>
                        {d.residual > 0 ? `+${d.residual}` : d.residual} {unit}
                      </span>
                    </div>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="model_value"
              name="Model Prediction"
              stroke="#22d3ee"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, stroke: '#22d3ee', fill: '#010610' }}
            />
            <Line
              type="monotone"
              dataKey="obs_value"
              name="In-Situ Observation"
              stroke="#34d399"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3.5, stroke: '#34d399', fill: '#010610' }}
              activeDot={{ r: 5, stroke: '#34d399', fill: '#34d399' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
