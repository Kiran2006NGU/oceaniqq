/**
 * ObservationProfile — depth vs variable Recharts profile chart
 * SIH 26067 | Ocean Intelligence Platform
 *
 * Phase 3: Fetches profile data asynchronously from API or mock fallback.
 */

import { useState, useMemo, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MockObservation, ProfilePoint } from '@/services/data/mockOceanData'
import { getProfileData } from '@/services/data/mockOceanData'
import { getDataSourceObservationProfile, isApiMode } from '@/services/data/dataSource'

type ProfileVariable = 'temperature' | 'salinity' | 'chlorophyll'

const PROFILE_VARS: { id: ProfileVariable; label: string; unit: string; color: string }[] = [
  { id: 'temperature', label: 'Temp', unit: '°C',    color: '#f97316' },
  { id: 'salinity',    label: 'Sal',  unit: 'PSU',   color: '#22d3ee' },
  { id: 'chlorophyll', label: 'Chl',  unit: 'mg/m³', color: '#22c55e' },
]

interface ObservationProfileProps {
  observation: MockObservation
}

export function ObservationProfile({ observation }: ObservationProfileProps) {
  const [profileVar, setProfileVar] = useState<ProfileVariable>('temperature')
  const [profileData, setProfileData] = useState<ProfilePoint[]>(() => getProfileData(observation))
  const [isLoading, setIsLoading] = useState(isApiMode)

  // Fetch profile data when observation changes
  useEffect(() => {
    let cancelled = false
    setIsLoading(isApiMode)

    getDataSourceObservationProfile(observation)
      .then((data) => {
        if (!cancelled) {
          setProfileData(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Already initialized to mock data; just keep it
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [observation])

  const chartData = useMemo(
    () => profileData.map((p) => ({ depth: p.depth, value: p[profileVar] })),
    [profileData, profileVar]
  )

  const varCfg = PROFILE_VARS.find((v) => v.id === profileVar)!

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/5">
        <div className="text-[9px] uppercase tracking-widest text-ocean-500 font-bold mb-1.5">
          Depth Profile — {observation.platformId}
        </div>
        {/* Variable tabs */}
        <div className="flex gap-1">
          {PROFILE_VARS.map((v) => (
            <button
              key={v.id}
              onClick={() => setProfileVar(v.id)}
              className={[
                'flex-1 py-1 rounded text-[10px] font-mono font-semibold transition-all',
                profileVar === v.id
                  ? 'border'
                  : 'text-ocean-500 hover:text-ocean-300',
              ].join(' ')}
              style={
                profileVar === v.id
                  ? { color: v.color, borderColor: `${v.color}50`, background: `${v.color}18` }
                  : undefined
              }
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-5 h-5 mx-auto mb-2 border-2 border-ocean-500/40 border-t-ocean-400 rounded-full animate-spin" />
            <span className="text-[10px] text-ocean-500 font-mono">Loading profile…</span>
          </div>
        </div>
      ) : (
        /* Chart */
        <div className="flex-1 min-h-0 px-1 py-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                dataKey="value"
                domain={['auto', 'auto']}
                tick={{ fontSize: 9, fill: '#4a6c8a', fontFamily: 'Calibri, sans-serif' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                label={{
                  value: `${varCfg.label} (${varCfg.unit})`,
                  position: 'insideBottomRight',
                  offset: -4,
                  style: { fontSize: 9, fill: '#4a6c8a', fontFamily: 'Calibri, sans-serif' },
                }}
              />
              <YAxis
                type="number"
                dataKey="depth"
                reversed
                domain={[0, 2000]}
                tick={{ fontSize: 9, fill: '#4a6c8a', fontFamily: 'Calibri, sans-serif' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={(v: number) => `${v}m`}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(2,15,30,0.95)',
                  border: '1px solid rgba(0,180,216,0.3)',
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: 'Calibri, sans-serif',
                  color: '#c8e6f5',
                }}
                formatter={(value: unknown) => [`${(value as number).toFixed(2)} ${varCfg.unit}`, varCfg.label]}
                labelFormatter={(label: unknown) => `Depth: ${label as number} m`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={varCfg.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, stroke: varCfg.color, fill: '#020f1e' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data source label */}
      <div className="px-3 pb-2">
        <span className="text-[9px] text-amber-500/70 font-mono">
          {isApiMode ? '⚡ API PROFILE DATA' : '⚠ DEMO PROFILE DATA'}
        </span>
      </div>
    </div>
  )
}


