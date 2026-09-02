/**
 * UserRoleContext.tsx — Non-Intrusive Role-Based Access & Complexity Tailoring
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Roles:
 * - 'citizen': Public citizen / student (simplified views, plain language, clear hazard badges)
 * - 'scientist': Ocean researcher (full validation controls, tolerance sliders, raw data tables)
 * - 'operator': Disaster & maritime authority (SAR search cones, critical warnings, operational alerts)
 */

import React, { createContext, useContext, useEffect, useState } from 'react'

export type UserRole = 'citizen' | 'scientist' | 'operator'

interface RoleDefinition {
  id: UserRole
  label: string
  icon: string
  badge: string
  description: string
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  citizen: {
    id: 'citizen',
    label: 'Public Citizen',
    icon: '👤',
    badge: 'Citizen View',
    description: 'Plain-language summaries, simplified 3D parameters, and public coastal hazard advisories.',
  },
  scientist: {
    id: 'scientist',
    label: 'Research Scientist',
    icon: '🔬',
    badge: 'Scientist View',
    description: 'Full spatiotemporal tolerance controls, paired vertical profiles, raw NetCDF metadata, and statistical metrics.',
  },
  operator: {
    id: 'operator',
    label: 'Disaster Authority',
    icon: '🛡️',
    badge: 'Operations View',
    description: 'Emergency SAR drift prediction, cyclone cyclogenesis fuel, and marine heatwave bleaching alerts.',
  },
}

interface UserRoleContextValue {
  role: UserRole
  roleInfo: RoleDefinition
  setRole: (role: UserRole) => void
  cycleRole: () => void
  isScientist: boolean
  isOperator: boolean
  isCitizen: boolean
}

const UserRoleContext = createContext<UserRoleContextValue | undefined>(undefined)

const ROLE_STORAGE_KEY = 'oceaniq_user_role'

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem(ROLE_STORAGE_KEY)
      if (stored === 'citizen' || stored === 'scientist' || stored === 'operator') {
        return stored
      }
    } catch {
      // Fallback
    }
    return 'scientist' // Default to scientist for hackathon demonstration
  })

  useEffect(() => {
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, role)
    } catch {
      // Ignore
    }
  }, [role])

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole)
  }

  const cycleRole = () => {
    setRoleState((prev) => {
      if (prev === 'scientist') return 'operator'
      if (prev === 'operator') return 'citizen'
      return 'scientist'
    })
  }

  const roleInfo = ROLE_DEFINITIONS[role]

  return (
    <UserRoleContext.Provider
      value={{
        role,
        roleInfo,
        setRole,
        cycleRole,
        isScientist: role === 'scientist',
        isOperator: role === 'operator',
        isCitizen: role === 'citizen',
      }}
    >
      {children}
    </UserRoleContext.Provider>
  )
}

export function useUserRole() {
  const context = useContext(UserRoleContext)
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider')
  }
  return context
}
