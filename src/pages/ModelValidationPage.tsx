/**
 * ModelValidationPage.tsx — Model vs Observation Validation Workstation
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Routes: /compare and /validation
 * Integrates multi-dataset ingestion (NetCDF, CSV, TSV, TXT, JSON),
 * spatiotemporal point matching, residual calculations, accuracy classification,
 * profile/residual charts, and synchronized 3D observation inspector.
 */

import { ModelObservationWorkspace } from '@/components/comparison/ModelObservationWorkspace'

export function ModelValidationPage() {
  return <ModelObservationWorkspace />
}
