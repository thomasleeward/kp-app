import { CheckCircle2, Circle, Lock, UserCheck } from 'lucide-react'
import { LeadershipStepWithProgress, CompletionSource } from '@/lib/services/progress'

const sourceBadge: Record<CompletionSource, { label: string; className: string }> = {
  self_reported:   { label: 'Self-reported', className: 'bg-yellow-100 text-yellow-800' },
  staff_confirmed: { label: 'Confirmed',     className: 'bg-green-100 text-green-800' },
  pc_synced:       { label: 'Synced',        className: 'bg-blue-100 text-blue-800' },
}

const STAGE_ORDER = ['identification', 'instruction', 'impartation', 'internship']

const stageLabels: Record<string, string> = {
  identification: 'Identification',
  instruction:    'Instruction',
  impartation:    'Impartation',
  internship:     'Internship',
}

interface Props {
  steps: LeadershipStepWithProgress[]
}

export default function LeadershipTrack({ steps }: Props) {
  // Group steps by level
  const levels = steps.reduce<Record<number, { name: string; steps: LeadershipStepWithProgress[] }>>(
    (acc, step) => {
      if (!acc[step.level]) acc[step.level] = { name: step.level_name, steps: [] }
      acc[step.level].steps.push(step)
      return acc
    },
    {}
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Leadership Track</h2>
        <p className="text-sm text-gray-500 mt-0.5">Complete all 4 stages to advance to the next level</p>
      </div>

      <div className="divide-y divide-gray-100">
        {Object.entries(levels).map(([levelNum, level]) => {
          const isLocked = level.steps[0]?.levelLocked ?? false
          const completedCount = level.steps.filter(s => s.completion).length
          const isFullyComplete = completedCount === level.steps.length

          return (
            <div key={levelNum} className={`px-5 py-4 ${isLocked ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isLocked && <Lock size={14} className="text-gray-400" />}
                  {isFullyComplete && <CheckCircle2 size={14} className="text-green-500" />}
                  <p className="text-sm font-semibold text-gray-800">
                    Level {levelNum}: {level.name}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{completedCount}/{level.steps.length}</span>
              </div>

              <div className="space-y-2.5">
                {level.steps
                  .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage))
                  .map(step => (
                    <StageRow key={step.id} step={step} levelLocked={isLocked} />
                  ))}
              </div>

              {isLocked && (
                <p className="mt-3 text-xs text-gray-400">
                  Complete all Level {Number(levelNum) - 1} stages to unlock this level
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StageRow({ step, levelLocked }: { step: LeadershipStepWithProgress; levelLocked: boolean }) {
  const isComplete = !!step.completion

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">
        {levelLocked ? (
          <Lock size={16} className="text-gray-300" />
        ) : isComplete ? (
          <CheckCircle2 size={16} className="text-green-500" />
        ) : (
          <Circle size={16} className="text-gray-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-24 shrink-0">
            {stageLabels[step.stage]}
          </span>
          <span className={`text-sm ${isComplete ? 'text-gray-900' : 'text-gray-600'}`}>
            {step.name}
          </span>
          {step.is_staff_assigned && !isComplete && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <UserCheck size={11} />
              Staff invite
            </span>
          )}
          {isComplete && step.completion && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceBadge[step.completion.completion_source].className}`}>
              {sourceBadge[step.completion.completion_source].label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
