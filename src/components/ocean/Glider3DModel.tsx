/**
 * Glider3DModel.tsx — 3D Autonomous Underwater Glider (AUV) & Sawtooth Profiling Trajectory
 * SIH 26067 | Ocean Intelligence Platform
 *
 * Renders:
 * 1. Detailed 3D research glider vehicle with fuselage, swept wings, vertical stabiliser, and antenna.
 * 2. 3D sawtooth profiling trajectory line (dive/climb cycles) with color-coded in-situ telemetry.
 * 3. 3D HTML / HUD tooltip displaying real-time vehicle telemetry.
 */

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

interface Glider3DModelProps {
  gliderId?: string
  temperature?: number
  salinity?: number
  timestamp?: string
  currentDepth?: number // in meters
  verticalExaggeration?: number
  scale?: number
  visiblePath?: boolean
}

export function Glider3DModel({
  gliderId = 'SG-152',
  temperature = 5.2,
  salinity = 34.9,
  timestamp = '14:30 UTC',
  currentDepth = 380,
  verticalExaggeration = 1.0,
  scale = 1.0,
  visiblePath = true,
}: Glider3DModelProps) {
  const gliderGroupRef = useRef<THREE.Group | null>(null)
  const yFactor = Math.min(2.5, 0.8 + (verticalExaggeration - 1) * 0.2)

  // Subtle floating/pitching animation for the glider in water
  useFrame(({ clock }) => {
    if (!gliderGroupRef.current) return
    const t = clock.getElapsedTime()
    gliderGroupRef.current.rotation.z = Math.sin(t * 0.8) * 0.05 + 0.15 // glide pitch angle
    gliderGroupRef.current.position.y = -0.42 * yFactor + Math.sin(t * 0.6) * 0.015 // gentle buoyancy drift
  })

  // ─── Sawtooth Yo-Yo Profiling Trajectory Path ───────────────────────────────
  // Creates the characteristic zig-zag dive/climb trajectory seen in ocean glider missions
  const trajectoryGeo = useMemo(() => {
    // 7 sawtooth peaks/troughs across the volume from top-left (shallow) to bottom-right (deep)
    const waypoints: THREE.Vector3[] = [
      new THREE.Vector3(-0.65, 0.08 * yFactor, -0.65),  // Surface 1 (warm red)
      new THREE.Vector3(-0.52, -0.22 * yFactor, -0.52), // Dive 1
      new THREE.Vector3(-0.40, 0.06 * yFactor, -0.40),  // Climb 1
      new THREE.Vector3(-0.28, -0.32 * yFactor, -0.28), // Dive 2
      new THREE.Vector3(-0.16, 0.04 * yFactor, -0.16),  // Climb 2
      new THREE.Vector3(-0.04, -0.38 * yFactor, -0.04), // Dive 3
      new THREE.Vector3(0.08, 0.02 * yFactor, 0.08),    // Climb 3
      new THREE.Vector3(0.18, -0.42 * yFactor, 0.18),   // Current Glider position
    ]

    const curve = new THREE.CatmullRomCurve3(waypoints)
    const points = curve.getPoints(120)
    const positions = new Float32Array(points.length * 3)
    const colors = new Float32Array(points.length * 3)

    // Colormap for glider in-situ temperature:
    // Shallow (y > -0.05) -> Warm Red/Orange
    // Mid-depth (y -0.05 to -0.25) -> Yellow/Green
    // Deep (y < -0.25) -> Cyan/Blue
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      positions[i * 3]     = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z

      // Normalized depth fraction: 0 (surface) to 1 (deep)
      const depthFrac = Math.max(0, Math.min(1, (0.1 - p.y) / 0.55))

      let r = 0.9, g = 0.2, b = 0.1
      if (depthFrac < 0.25) {
        // Red-orange surface
        r = 0.95; g = 0.35 + depthFrac * 1.2; b = 0.1
      } else if (depthFrac < 0.6) {
        // Yellow -> green-cyan thermocline
        const t = (depthFrac - 0.25) / 0.35
        r = 0.9 - t * 0.7; g = 0.85 + t * 0.1; b = 0.1 + t * 0.7
      } else {
        // Cyan -> deep navy blue
        const t = (depthFrac - 0.6) / 0.4
        r = 0.1; g = 0.75 - t * 0.45; b = 0.9
      }

      colors[i * 3]     = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  const trajectoryLine = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 2 })
    return new THREE.Line(trajectoryGeo, mat)
  }, [trajectoryGeo])

  return (
    <group scale={[scale, scale, scale]}>
      {/* ── Sawtooth profiling trajectory polyline ──────────────────────────── */}
      {visiblePath && <primitive object={trajectoryLine} />}

      {/* ── 3D Glider Vehicle stationed at current depth ───────────────────── */}
      <group ref={gliderGroupRef} position={[0.18, -0.42, 0.18]} rotation={[0.1, -0.75, 0.12]}>
        {/* Main Torpedo Fuselage */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.024, 0.22, 16]} />
          <meshStandardMaterial
            color="#e2e8f0" // High-vis research white/grey
            roughness={0.25}
            metalness={0.4}
          />
        </mesh>

        {/* Nose cone (Sonar / CTD sensor head) */}
        <mesh position={[0.115, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.022, 0.045, 16]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.5} />
        </mesh>

        {/* Tail cone / Rudder assembly */}
        <mesh position={[-0.125, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.024, 0.04, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>

        {/* Swept Hydrodynamic Wings */}
        <mesh position={[0.01, 0, 0]}>
          <boxGeometry args={[0.04, 0.003, 0.28]} />
          <meshStandardMaterial color="#d97706" roughness={0.3} metalness={0.3} />
        </mesh>

        {/* Winglets */}
        <mesh position={[0.01, 0.012, 0.14]}>
          <boxGeometry args={[0.03, 0.025, 0.003]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.01, 0.012, -0.14]}>
          <boxGeometry args={[0.03, 0.025, 0.003]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* Vertical Tail Stabiliser / Rudder */}
        <mesh position={[-0.11, 0.03, 0]}>
          <boxGeometry args={[0.045, 0.055, 0.003]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>

        {/* Antenna Mast (Iridium satellite telemetry stalk) */}
        <mesh position={[-0.13, 0.04, 0]} rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.002, 0.002, 0.09, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>

        {/* ── HUD Telemetry Tooltip Badge (Matching Reference Pic) ────────── */}
        <Html
          position={[0.04, 0.065, 0]}
          center
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-white/20 shadow-2xl flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-medium text-slate-100">
              <strong className="text-amber-400">Glider ID: {gliderId}</strong> | Depth: {currentDepth}m | Temp: {temperature.toFixed(1)}°C | Salinity: {salinity.toFixed(1)} PSU | Time: {timestamp}
            </span>
          </div>
        </Html>
      </group>
    </group>
  )
}
