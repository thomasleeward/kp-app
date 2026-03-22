'use client'

import { useEffect, useState } from 'react'

interface Phase {
  num: number
  isComplete: boolean
  isStarted: boolean
}

interface Props {
  percent: number
  phases: Phase[]
}

export default function DiscipleshipRing({ percent, phases }: Props) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [])

  const cx = 100
  const cy = 100
  const radius = 68
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - (animated ? percent : 0) / 100)
  const ringColor = percent === 100 ? '#22c55e' : '#3b82f6'

  // Phase dots at compass points, just outside the ring
  const dotR = 84
  const dotPositions = [
    { x: cx,        y: cy - dotR }, // top    — Phase 1
    { x: cx + dotR, y: cy        }, // right  — Phase 2
    { x: cx,        y: cy + dotR }, // bottom — Phase 3
    { x: cx - dotR, y: cy        }, // left   — Phase 4
  ]

  return (
    <div className="flex justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />

        {/* Progress ring */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.9s ease, stroke 0.4s ease' }}
        />

        {/* Center percentage */}
        <text
          x={cx} y={cy - 6}
          textAnchor="middle"
          style={{ fontSize: '28px', fontWeight: 700, fill: '#111827' }}
        >
          {percent}%
        </text>
        <text
          x={cx} y={cy + 14}
          textAnchor="middle"
          style={{ fontSize: '11px', fill: '#9ca3af', letterSpacing: '0.05em' }}
        >
          complete
        </text>

        {/* Phase dots */}
        {phases.map((phase, i) => {
          const pos = dotPositions[i]
          if (!pos) return null
          const fill = phase.isComplete ? '#22c55e' : phase.isStarted ? '#3b82f6' : '#d1d5db'
          return (
            <circle key={phase.num} cx={pos.x} cy={pos.y} r={7} fill={fill} />
          )
        })}
      </svg>
    </div>
  )
}
