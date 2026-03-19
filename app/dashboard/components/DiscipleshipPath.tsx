import { CheckCircle2, Circle, Lock, AlertTriangle, Check } from 'lucide-react'
import { DiscipleshipStepWithProgress, CompletionSource } from '@/lib/services/progress'

const sourceBadge: Record<CompletionSource, { label: string; className: string }> = {
  self_reported:   { label: 'Self-reported', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  staff_confirmed: { label: 'Confirmed',     className: 'bg-green-50 text-green-700 ring-1 ring-green-200' },
  pc_synced:       { label: 'Synced',        className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
}

interface Props {
  steps: DiscipleshipStepWithProgress[]
}

export default function DiscipleshipPath({ steps }: Props) {
  const phases = steps.reduce<Record<number, { name: string; steps: DiscipleshipStepWithProgress[] }>>(
    (acc, step) => {
      if (!acc[step.phase]) acc[step.phase] = { name: step.phase_name, steps: [] }
      acc[step.phase].steps.push(step)
      return acc
    },
    {}
  )

  const completedCount = steps.filter(s => s.completion).length
  const totalCount = steps.length
  const percent = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Discipleship Path</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {completedCount} of {totalCount} steps complete
            </p>
          </div>
          <span className="text-2xl font-bold text-blue-600">{percent}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Phases */}
      <div className="px-6 pb-6 space-y-6">
        {Object.entries(phases).map(([phaseNum, phase]) => {
          const isComplete = phase.steps.every(s => s.completion)
          const isStarted = phase.steps.some(s => s.completion)

          return (
            <div key={phaseNum}>
              {/* Phase header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors
                  ${isComplete
                    ? 'bg-green-500 text-white'
                    : isStarted
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                  {isComplete ? <Check size={13} /> : phaseNum}
                </div>
                <span className="text-sm font-semibold text-gray-700">{phase.name}</span>
                {isComplete && (
                  <span className="text-xs font-medium text-green-600">Complete</span>
                )}
                {isStarted && !isComplete && (
                  <span className="text-xs font-medium text-blue-500">In progress</span>
                )}
              </div>

              {/* Steps */}
              <div className="ml-10 space-y-2.5">
                {phase.steps.map(step => (
                  <StepRow key={step.id} step={step} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StepRow({ step }: { step: DiscipleshipStepWithProgress }) {
  const isComplete = !!step.completion
  const { isLocked, showFlag } = step

  return (
    <div className={`transition-opacity ${isLocked ? 'opacity-40' : 'opacity-100'}`}>
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">
          {isLocked ? (
            <Lock size={15} className="text-gray-300" />
          ) : isComplete ? (
            <CheckCircle2 size={15} className="text-green-500" />
          ) : (
            <Circle size={15} className="text-gray-200" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-sm ${isComplete ? 'text-gray-800' : 'text-gray-500'}`}>
              {step.name}
            </span>
            {isComplete && step.completion && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceBadge[step.completion.completion_source].className}`}>
                {sourceBadge[step.completion.completion_source].label}
              </span>
            )}
            {isLocked && (
              <span className="text-xs text-gray-300">Requires previous step</span>
            )}
          </div>
          {showFlag && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
              <AlertTriangle size={11} className="shrink-0" />
              <span>You should complete Growth Track — talk to your team leader</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
