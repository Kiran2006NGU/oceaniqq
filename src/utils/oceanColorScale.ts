/**
 * oceanColorScale — colormaps for oceanographic variables
 * SIH 26067 | Ocean Intelligence Platform
 *
 * Each variable has:
 *  - min/max physical range
 *  - a perceptually-designed colormap (simplified from cmocean)
 *  - CSS gradient string for DOM components
 *  - Three.js-compatible RGB (0–1 range) interpolation
 */

import type { OceanVariable } from '@/types/ocean'

// ─── Internal types ────────────────────────────────────────────────────────────

interface RGB { r: number; g: number; b: number }
interface ColorStop { t: number; rgb: RGB } // t ∈ [0, 1]

// ─── Colormaps (simplified cmocean) ──────────────────────────────────────────

/** thermal — temperature (cold blue → warm orange/red) */
const THERMAL: ColorStop[] = [
  { t: 0.00, rgb: { r: 0.04, g: 0.10, b: 0.28 } },
  { t: 0.20, rgb: { r: 0.07, g: 0.40, b: 0.68 } },
  { t: 0.40, rgb: { r: 0.10, g: 0.70, b: 0.75 } },
  { t: 0.60, rgb: { r: 0.50, g: 0.85, b: 0.45 } },
  { t: 0.75, rgb: { r: 0.98, g: 0.75, b: 0.10 } },
  { t: 0.90, rgb: { r: 0.92, g: 0.30, b: 0.10 } },
  { t: 1.00, rgb: { r: 0.55, g: 0.05, b: 0.05 } },
]

/** haline — salinity (dark purple → cyan → yellow) */
const HALINE: ColorStop[] = [
  { t: 0.00, rgb: { r: 0.16, g: 0.04, b: 0.30 } },
  { t: 0.25, rgb: { r: 0.17, g: 0.30, b: 0.72 } },
  { t: 0.50, rgb: { r: 0.10, g: 0.60, b: 0.82 } },
  { t: 0.75, rgb: { r: 0.20, g: 0.82, b: 0.55 } },
  { t: 1.00, rgb: { r: 0.99, g: 0.97, b: 0.18 } },
]

/** algae — chlorophyll (near-black → dark green → yellow-green) */
const ALGAE: ColorStop[] = [
  { t: 0.00, rgb: { r: 0.21, g: 0.25, b: 0.22 } },
  { t: 0.20, rgb: { r: 0.06, g: 0.42, b: 0.30 } },
  { t: 0.50, rgb: { r: 0.12, g: 0.62, b: 0.32 } },
  { t: 0.75, rgb: { r: 0.50, g: 0.82, b: 0.28 } },
  { t: 1.00, rgb: { r: 0.93, g: 0.97, b: 0.12 } },
]

/** velocity — current magnitude (dark blue → light blue → orange → red) */
const VELOCITY: ColorStop[] = [
  { t: 0.00, rgb: { r: 0.04, g: 0.22, b: 0.48 } },
  { t: 0.30, rgb: { r: 0.12, g: 0.55, b: 0.78 } },
  { t: 0.60, rgb: { r: 0.52, g: 0.80, b: 0.90 } },
  { t: 0.80, rgb: { r: 0.98, g: 0.68, b: 0.25 } },
  { t: 1.00, rgb: { r: 0.82, g: 0.08, b: 0.04 } },
]

// ─── Variable config ──────────────────────────────────────────────────────────

export interface VariableColorConfig {
  id: OceanVariable
  label: string
  shortLabel: string
  unit: string
  min: number
  max: number
  colormap: ColorStop[]
  cssGradient: string
}

function buildGradient(stops: ColorStop[]): string {
  const parts = stops.map((s) => {
    const r = Math.round(s.rgb.r * 255)
    const g = Math.round(s.rgb.g * 255)
    const b = Math.round(s.rgb.b * 255)
    return `rgb(${r},${g},${b}) ${Math.round(s.t * 100)}%`
  })
  return `linear-gradient(to right, ${parts.join(', ')})`
}

export const VARIABLE_COLOR_CONFIGS: Record<OceanVariable, VariableColorConfig> = {
  temperature: {
    id: 'temperature', label: 'Sea Surface Temperature', shortLabel: 'Temperature',
    unit: '°C', min: -2, max: 34,
    colormap: THERMAL, cssGradient: buildGradient(THERMAL),
  },
  salinity: {
    id: 'salinity', label: 'Salinity', shortLabel: 'Salinity',
    unit: 'PSU', min: 30, max: 40,
    colormap: HALINE, cssGradient: buildGradient(HALINE),
  },
  chlorophyll: {
    id: 'chlorophyll', label: 'Chlorophyll-a', shortLabel: 'Chl-a',
    unit: 'mg/m³', min: 0, max: 5,
    colormap: ALGAE, cssGradient: buildGradient(ALGAE),
  },
  current_u: {
    id: 'current_u', label: 'Eastward Current (U)', shortLabel: 'Current U',
    unit: 'm/s', min: -2, max: 2,
    colormap: VELOCITY, cssGradient: buildGradient(VELOCITY),
  },
  current_v: {
    id: 'current_v', label: 'Northward Current (V)', shortLabel: 'Current V',
    unit: 'm/s', min: -2, max: 2,
    colormap: VELOCITY, cssGradient: buildGradient(VELOCITY),
  },
  current_w: {
    id: 'current_w', label: 'Vertical Current (W)', shortLabel: 'Current W',
    unit: 'm/s', min: -0.1, max: 0.1,
    colormap: VELOCITY, cssGradient: buildGradient(VELOCITY),
  },
  current_velocity: {
    id: 'current_velocity', label: 'Current Velocity (Speed)', shortLabel: 'Current Speed',
    unit: 'm/s', min: 0, max: 2.5,
    colormap: VELOCITY, cssGradient: buildGradient(VELOCITY),
  },
}

// ─── Interpolation ────────────────────────────────────────────────────────────

function interpolateRGB(stops: ColorStop[], t: number): RGB {
  const clamped = Math.max(0, Math.min(1, t))
  if (clamped <= stops[0].t) return stops[0].rgb
  const last = stops[stops.length - 1]
  if (clamped >= last.t) return last.rgb

  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].t && clamped <= stops[i + 1].t) {
      const span = stops[i + 1].t - stops[i].t
      const f = span === 0 ? 0 : (clamped - stops[i].t) / span
      const a = stops[i].rgb
      const b = stops[i + 1].rgb
      return {
        r: a.r + f * (b.r - a.r),
        g: a.g + f * (b.g - a.g),
        b: a.b + f * (b.b - a.b),
      }
    }
  }
  return last.rgb
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Map an ocean variable value to Three.js RGB [0–1].
 */
export function valueToRGB(value: number, variable: OceanVariable): [number, number, number] {
  const cfg = VARIABLE_COLOR_CONFIGS[variable]
  const t = (value - cfg.min) / (cfg.max - cfg.min)
  const { r, g, b } = interpolateRGB(cfg.colormap, t)
  return [r, g, b]
}

/**
 * Map current velocity magnitude to Three.js RGB [0–1].
 */
export function velocityToRGB(magnitude: number): [number, number, number] {
  const t = Math.min(magnitude / 1.5, 1)
  const { r, g, b } = interpolateRGB(VELOCITY, t)
  return [r, g, b]
}

/**
 * Map value to CSS colour string (for DOM use).
 */
export function valueToCSSColor(value: number, variable: OceanVariable): string {
  const [r, g, b] = valueToRGB(value, variable)
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`
}
