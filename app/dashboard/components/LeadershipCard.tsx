'use client'

import { useState } from 'react'
import { expressLeadershipInterest } from '@/app/actions/leadership'
import { CheckCircle2, Circle, ChevronRight, CheckCircle, Lock } from 'lucide-react'
import { LeadershipStepWithProgress, CompletionSource } from '@/lib/services/progress'

const STAGE_ORDER = ['identification', 'instruction', 'impartation', 'internship']
const stageLabels: Record<string, string> = {
  identification: 'Identification',
  instruction:    'Instruction',
  impartation:    'Impartation',
  internship:     'Internship',
}

const sourceBadge: Record<CompletionSource, { label: string; className: string }> = {
  self_reported:   { label: 'Self-reported', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  staff_confirmed: { label: 'Confirmed',     className: 'bg-green-50 text-green-700 ring-1 ring-green-200' },
  pc_synced:       { label: 'Synced',        className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
}

interface Props {
  userId: string
  trackUnlocked: boolean
  alreadyInterested: boolean
  steps: LeadershipStepWithProgress[]
}

export default function LeadershipCard({ userId, trackUnlocked, alreadyInterested, steps }: Props) {
  const [submitted, setSubmitted] = useState(alreadyInterested)
  const [loading, setLoading] = useState(false)

  async function handleInterest() {
    setLoading(true)
    await expressLeadershipInterest(userId)
    setSubmitted(true)
    setLoading(false)
  }

  // Show interest card if track is not unlocked yet
  if (!trackUnlocked) {
    return (
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-7">
          {submitted ? (
            <div className="flex flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">We'll be in touch!</h2>
                <p className="text-blue-100 text-sm mt-1 leading-relaxed">
                  Great! We've notified our team and someone will reach out to you soon about your leadership journey.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Ready to Lead?</h2>
                <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
                  Are you interested in going deeper and becoming a leader at King's Park?
                  Let us know and we'll reach out to get you started.
                </p>
              </div>
              <button
                onClick={handleInterest}
                disabled={loading}
                className="self-start flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors disabled:opacity-70"
              >
                {loading ? 'Sending...' : "I'm Interested"}
                {!loading && <ChevronRight size={15} />}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Full leadership track view (unlocked by staff)
  const levels = steps.reduce<Record<number, { name: string; steps: LeadershipStepWithProgress[] }>>(
    (acc, step) => {
      if (!acc[step.level]) acc[step.level] = { name: step.level_name, steps: [] }
      acc[step.level].steps.push(step)
      return acc
    },
    {}
  )

  const completedCount = steps.filter(s => s.completion).length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Leadership Track</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Complete all 4 stages to advance each level
            </p>
          </div>
          <span className="text-2xl font-bold text-indigo-600">
            {Math.round((completedCount / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((completedCount / steps.length) * 100)}%` }}
          />
        </div>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {Object.entries(levels).map(([levelNum, level]) => {
          const isLocked = level.steps[0]?.levelLocked ?? false
          const levelComplete = level.steps.every(s => s.completion)
          const levelStarted = level.steps.some(s => s.completion)

          return (
            <div key={levelNum} className={isLocked ? 'opacity-40' : ''}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                  ${levelComplete ? 'bg-indigo-500 text-white' : levelStarted ? 'bg-indigo-400 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {levelComplete ? <CheckCircle2 size={13} /> : levelNum}
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  Level {levelNum}: {level.name}
                </span>
                {isLocked && <Lock size={12} className="text-gray-300" />}
              </div>

              <div className="ml-10 space-y-2.5">
                {level.steps
                  .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage))
                  .map(step => {
                    const isComplete = !!step.completion
                    return (
                      <div key={step.id} className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {isComplete
                            ? <CheckCircle2 size={15} className="text-indigo-500" />
                            : <Circle size={15} className="text-gray-200" />}
                        </div>
                        <div className="flex-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-300 w-20 shrink-0">
                            {stageLabels[step.stage]}
                          </span>
                          <span className={`text-sm ${isComplete ? 'text-gray-800' : 'text-gray-500'}`}>
                            {step.name}
                          </span>
                          {isComplete && step.completion && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceBadge[step.completion.completion_source].className}`}>
                              {sourceBadge[step.completion.completion_source].label}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

