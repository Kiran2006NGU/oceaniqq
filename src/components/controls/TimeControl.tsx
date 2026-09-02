/**
 * TimeControl.tsx — Scientific Temporal Axis & Model Playback Controller
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 */

import { Play, Pause, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import type { ModelTime } from '@/services/data/mockOceanData'

interface TimeControlProps {
  modelTimes: ModelTime[]
  selectedTimeIndex: number
  isPlaying: boolean
  onSelectTime: (i: number) => void
  onTogglePlay: () => void
  onStep: (dir: 1 | -1) => void
}

export function TimeControl({
  modelTimes,
  selectedTimeIndex,
  isPlaying,
  onSelectTime,
  onTogglePlay,
  onStep,
}: TimeControlProps) {
  const current = modelTimes[selectedTimeIndex]
  const startTime = modelTimes[0]
  const endTime = modelTimes[modelTimes.length - 1]

  return (
    <div className="flex items-center gap-3 px-2 py-1 flex-1 font-sans text-xs">
      {/* Play / Step Buttons */}
      <div className="flex items-center gap-1 bg-[#040f1f] border border-white/10 rounded-md p-0.5">
        <button
          onClick={() => onStep(-1)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Previous time step (-6h)"
          aria-label="Previous time step"
        >
          <ChevronLeft size={14} />
        </button>

        <button
          onClick={onTogglePlay}
          className={[
            'p-1.5 rounded transition-all',
            isPlaying
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
              : 'hover:bg-white/5 text-slate-300 hover:text-white',
          ].join(' ')}
          title={isPlaying ? 'Pause timeline playback' : 'Play timeline'}
          aria-label={isPlaying ? 'Pause timeline playback' : 'Play timeline'}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
        </button>

        <button
          onClick={() => onStep(1)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Next time step (+6h)"
          aria-label="Next time step"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Temporal Timeline Axis */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
          <span>{startTime ? `${startTime.dateLabel} ${startTime.label} UTC` : 'T_START'}</span>
          <span className="text-cyan-300 font-semibold flex items-center gap-1">
            <Clock size={10} />
            {current ? `${current.label} UTC` : ''}
          </span>
          <span>{endTime ? `${endTime.label} UTC` : 'T_END'}</span>
        </div>

        {/* Timeline Track & Steps */}
        <div className="relative flex items-center gap-1">
          {modelTimes.map((t, i) => {
            const isActive = i === selectedTimeIndex
            return (
              <button
                key={t.isoString}
                onClick={() => onSelectTime(i)}
                className="flex-1 py-1 group flex flex-col items-center gap-1 transition-all"
                title={`${t.dateLabel} ${t.label} UTC`}
                aria-label={`Time ${t.label} UTC`}
              >
                <div
                  className={[
                    'w-full h-1 rounded-full transition-all',
                    isActive
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                      : i < selectedTimeIndex
                      ? 'bg-cyan-900 group-hover:bg-cyan-700'
                      : 'bg-slate-800 group-hover:bg-slate-700',
                  ].join(' ')}
                />
                <span
                  className={[
                    'text-[9px] font-mono transition-colors',
                    isActive ? 'text-cyan-300 font-bold' : 'text-slate-500 group-hover:text-slate-300',
                  ].join(' ')}
                >
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
