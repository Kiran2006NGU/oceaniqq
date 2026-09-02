/**
 * OceanBasemap.tsx — Modular Basemap Provider Abstraction with High-Definition Satellite & Heatmap Modes
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Supports:
 * 1. 'satellite' — High-definition NASA Blue Marble Satellite Basemap with bathymetric reefs & graticule.
 * 2. 'heatmap' / 'aqua_vis' — Numerical Ocean Model Heatmap with strict land masking and X-Ray depth mode.
 */

import { AquaGlobe } from '../ocean/AquaGlobe'
import type { OceanVariable } from '@/types/ocean'
import type { ModelTime } from '@/services/data/mockOceanData'

export type BasemapProvider = 'aqua_vis' | 'procedural' | 'satellite' | 'heatmap' | 'google_3d_tiles'

interface OceanBasemapProps {
  provider?: BasemapProvider
  selectedVariable?: OceanVariable
  selectedDepth?: number
  selectedTimeIndex?: number
  selectedTime?: ModelTime
  showGraticule?: boolean
  showAtmosphere?: boolean
}

export function OceanBasemap({
  provider = 'heatmap',
  selectedVariable = 'temperature',
  selectedDepth = 0,
  selectedTimeIndex = 2,
  selectedTime,
  showAtmosphere = true,
}: OceanBasemapProps) {
  const isSatelliteOnly = provider === 'satellite' || provider === 'procedural' || provider === 'google_3d_tiles'

  return (
    <AquaGlobe
      selectedVariable={selectedVariable}
      selectedDepth={selectedDepth}
      selectedTimeIndex={selectedTimeIndex}
      selectedTime={selectedTime}
      showAtmosphere={showAtmosphere}
      showSatelliteOnly={isSatelliteOnly}
    />
  )
}
