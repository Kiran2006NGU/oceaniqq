import React from 'react'

const PALETTES = {
  thermal: { label: 'Thermal', colors: ['#0000ff', '#ff0000'] },
  haline: { label: 'Haline', colors: ['#0044aa', '#00cc66'] },
  viridis: { label: 'Viridis', colors: ['#440154', '#fde725'] },
}

const VAR_LABELS = {
  thetao: 'Temperature',
  so: 'Salinity',
  uo: 'Current (East)',
  vo: 'Current (North)',
}

export default function ControlsPanel({
  metadata,
  activeVar, setActiveVar,
  activeDepth, setActiveDepth,
  palette, setPalette,
  colorMin, setColorMin,
  colorMax, setColorMax,
  logScale, setLogScale,
  opacity, setOpacity,
  vertExag, setVertExag,
  showDiscrepancy, setShowDiscrepancy,
  showSatellite, setShowSatellite,
  isoValue, setIsoValue,
  showIso, setShowIso,
}) {
  if (!metadata) return null

  const ToggleSwitch = ({ checked, onChange }) => (
    <div 
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? '#3b82f6' : 'rgba(255,255,255,0.2)',
        position: 'relative', cursor: 'pointer', transition: '0.3s'
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: checked ? 18 : 2, transition: '0.3s'
      }} />
    </div>
  )

  return (
    <div
      style={{
        position: 'absolute',
        top: 90,
        left: 24,
        width: 320,
        zIndex: 15,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        color: '#e2e8f0',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Layer Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Layer</h2>
        
        {/* Ocean Model Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.05)', padding: '10px 12px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ToggleSwitch checked={true} onChange={() => {}} />
            <select
              value={activeVar || ''}
              onChange={(e) => setActiveVar(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 500, outline: 'none', cursor: 'pointer', padding: 0 }}
            >
              {metadata.variables?.map(v => (
                <option key={v} value={v} style={{ color: '#000' }}>{VAR_LABELS[v] || v}</option>
              ))}
            </select>
          </div>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>volume</span>
        </div>

        {/* In-Situ Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.05)', padding: '10px 12px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ToggleSwitch checked={showDiscrepancy} onChange={setShowDiscrepancy} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>In-Situ: Argo Floats</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>path</span>
        </div>
      </div>

      {/* Depth Slider */}
      {metadata.depths && activeDepth !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Depth Slice (m)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="range"
              min={0}
              max={metadata.depths.length - 1}
              step={1}
              value={metadata.depths.indexOf(activeDepth)}
              onChange={(e) => setActiveDepth(metadata.depths[Number(e.target.value)])}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#3b82f6' }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>{activeDepth}m</span>
          </div>
        </div>
      )}

      {/* Colorbar & Variable Controls (Collapsible) */}
      <details open style={{ marginTop: 2 }}>
        <summary style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', cursor: 'pointer', outline: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Colorbar & Controls
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10, paddingLeft: 8, borderLeft: '2px solid rgba(59,130,246,0.2)' }}>
          {/* Palette */}
          <div>
            <label style={labelStyle}>Color Palette</label>
            <select
              value={palette}
              onChange={(e) => setPalette(e.target.value)}
              style={selectStyle}
            >
              {Object.entries(PALETTES).map(([key, p]) => (
                <option key={key} value={key} style={{ color: '#000' }}>{p.label}</option>
              ))}
            </select>
            <div style={{
              width: '100%', height: 6, marginTop: 6, borderRadius: 3,
              background: `linear-gradient(to right, ${PALETTES[palette]?.colors[0]}, ${PALETTES[palette]?.colors[1]})`
            }} />
          </div>

          {/* Color Min/Max */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Min</label>
              <input
                type="number"
                step="0.1"
                value={colorMin}
                onChange={(e) => setColorMin(parseFloat(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Max</label>
              <input
                type="number"
                step="0.1"
                value={colorMax}
                onChange={(e) => setColorMax(parseFloat(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Toggles Row */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={logScale}
                onChange={(e) => setLogScale(e.target.checked)}
                style={{ accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <label style={{ ...labelStyle, marginBottom: 0, textTransform: 'none' }}>Log Scale</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={showSatellite}
                onChange={(e) => setShowSatellite(e.target.checked)}
                style={{ accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <label style={{ ...labelStyle, marginBottom: 0, textTransform: 'none' }}>Satellite</label>
            </div>
          </div>

          {/* Opacity */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={labelStyle}>Opacity</label>
              <span style={valueStyle}>{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range" min={0} max={1} step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              style={sliderStyle}
            />
          </div>

          {/* Vertical Exaggeration */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={labelStyle}>Vert. Exaggeration</label>
              <span style={valueStyle}>{vertExag.toFixed(1)}×</span>
            </div>
            <input
              type="range" min={0.5} max={10} step={0.5}
              value={vertExag}
              onChange={(e) => setVertExag(parseFloat(e.target.value))}
              style={sliderStyle}
            />
          </div>
        </div>
      </details>

      {/* Isosurface Control */}
      <details style={{ marginTop: 2 }}>
        <summary style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', cursor: 'pointer', outline: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Isosurface / Contour
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10, paddingLeft: 8, borderLeft: '2px solid rgba(234,179,8,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={showIso}
              onChange={(e) => setShowIso(e.target.checked)}
              style={{ accentColor: '#eab308', cursor: 'pointer' }}
            />
            <label style={{ ...labelStyle, marginBottom: 0, textTransform: 'none' }}>Show Contour Lines</label>
          </div>
          <div>
            <label style={labelStyle}>Iso Value</label>
            <input
              type="number"
              step="0.5"
              value={isoValue}
              onChange={(e) => setIsoValue(parseFloat(e.target.value) || 0)}
              style={inputStyle}
            />
          </div>
        </div>
      </details>
    </div>
  )
}

const labelStyle = {
  fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8',
  textTransform: 'uppercase', marginBottom: 4, display: 'block',
}
const valueStyle = {
  fontSize: '0.75rem', color: '#3b82f6', fontWeight: 'bold',
}
const selectStyle = {
  width: '100%', padding: '6px 8px', borderRadius: 6,
  background: 'rgba(15,23,42,0.8)', color: '#e2e8f0',
  border: '1px solid rgba(59,130,246,0.25)', fontSize: '0.8rem',
  cursor: 'pointer', outline: 'none',
}
const inputStyle = {
  width: '100%', padding: '6px 8px', borderRadius: 6,
  background: 'rgba(15,23,42,0.8)', color: '#e2e8f0',
  border: '1px solid rgba(59,130,246,0.25)', fontSize: '0.8rem',
  outline: 'none',
}
const sliderStyle = {
  width: '100%', cursor: 'pointer', accentColor: '#3b82f6',
}
