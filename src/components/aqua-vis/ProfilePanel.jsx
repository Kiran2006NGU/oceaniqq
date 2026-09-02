import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ProfilePanel({ profile, instrumentId, outreachMode, onClose }) {
  if (!profile || profile.length === 0) return null

  const timestamp = profile[0]?.timestamp
  const dateStr = timestamp
    ? new Date(timestamp).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    : 'Unknown'

  // Sort by depth ascending for chart
  const sorted = [...profile].sort((a, b) => a.depth - b.depth)

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 380,
        height: '100%',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideIn 0.3s ease-out',
      }}
      className="glass-panel"
    >
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              Argo Float Profile
            </h2>
            {!outreachMode && (
              <p style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: 4, fontFamily: 'Calibri, sans-serif' }}>
                {instrumentId}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
              borderRadius: 6,
              width: 32, height: 32,
              cursor: 'pointer',
              fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{
          marginTop: 10,
          padding: '6px 12px',
          background: 'rgba(99,102,241,0.1)',
          borderRadius: 6,
          border: '1px solid rgba(99,102,241,0.2)',
          fontSize: '0.8rem',
          color: '#a5b4fc'
        }}>
          Reading from <strong style={{ color: '#e2e8f0' }}>{dateStr}</strong>
        </div>
      </div>

      {/* Temperature Chart */}
      <div style={{ flex: 1, padding: '16px 12px 8px', overflow: 'auto' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 8 }}>
          Temperature vs Depth
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={sorted} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
            <XAxis
              dataKey="temperature"
              type="number"
              label={{ value: 'Temperature (°C)', position: 'bottom', offset: 0, style: { fill: '#94a3b8', fontSize: 11 } }}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              stroke="rgba(99,102,241,0.2)"
            />
            <YAxis
              dataKey="depth"
              reversed
              type="number"
              label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', offset: 0, style: { fill: '#94a3b8', fontSize: 11 } }}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              stroke="rgba(99,102,241,0.2)"
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.95)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8,
                color: '#e2e8f0',
                fontSize: 12,
              }}
              formatter={(val) => [`${val.toFixed(2)} °C`, 'Temperature']}
              labelFormatter={(val) => `Depth: ${val} m`}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 2, fill: '#f97316' }}
              activeDot={{ r: 4, fill: '#fb923c' }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Salinity Chart */}
        <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, marginTop: 16, paddingLeft: 8 }}>
          Salinity vs Depth
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={sorted} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
            <XAxis
              dataKey="salinity"
              type="number"
              label={{ value: 'Salinity (PSU)', position: 'bottom', offset: 0, style: { fill: '#94a3b8', fontSize: 11 } }}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              stroke="rgba(99,102,241,0.2)"
            />
            <YAxis
              dataKey="depth"
              reversed
              type="number"
              label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', offset: 0, style: { fill: '#94a3b8', fontSize: 11 } }}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              stroke="rgba(99,102,241,0.2)"
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.95)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8,
                color: '#e2e8f0',
                fontSize: 12,
              }}
              formatter={(val) => [`${val.toFixed(3)} PSU`, 'Salinity']}
              labelFormatter={(val) => `Depth: ${val} m`}
            />
            <Line
              type="monotone"
              dataKey="salinity"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ r: 2, fill: '#06b6d4' }}
              activeDot={{ r: 4, fill: '#22d3ee' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
