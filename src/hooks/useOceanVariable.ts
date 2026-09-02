/**
 * useOceanVariable — hook for managing active ocean variable state
 * SIH 26067 | Ocean Intelligence Platform
 */
import { OCEAN_VARIABLES } from '@/config'
import type { OceanVariable, OceanVariableConfig } from '@/types/ocean'
import { useState } from 'react'

interface UseOceanVariableReturn {
  activeVariable: OceanVariable
  variableConfig: OceanVariableConfig | undefined
  setActiveVariable: (v: OceanVariable) => void
  allVariables: OceanVariableConfig[]
}

export function useOceanVariable(initial: OceanVariable = 'temperature'): UseOceanVariableReturn {
  const [activeVariable, setActiveVariable] = useState<OceanVariable>(initial)

  const variableConfig = OCEAN_VARIABLES.find((v) => v.id === activeVariable)

  return {
    activeVariable,
    variableConfig,
    setActiveVariable,
    allVariables: OCEAN_VARIABLES,
  }
}
