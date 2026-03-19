'use client'

import { useState } from 'react'
import { selfReportSteps } from '@/app/actions/progress'
import { DiscipleshipStepWithProgress } from '@/lib/services/progress'
import { X, ClipboardList } from 'lucide-react'

interface Props {
  userId: string
  discipleshipSteps: DiscipleshipStepWithProgress[]
}

export default function SelfReportModal({ userId, discipleshipSteps }: Props) {
  const [open, setOpen] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  if (!open) return null

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSubmit() {
    setSaving(true)
    await selfReportSteps(userId, [...selected], [])
    setOpen(false)
  }

  const phases = discipleshipSteps.reduce<Record<number, { name: string; steps: DiscipleshipStepWithProgress[] }>>(
    (acc, step) => {
      if (!acc[step.phase]) acc[step.phase] = { name: step.phase_name, steps: [] }
      acc[step.phase].steps.push(step)
      return acc
    },
    {}
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-xl">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <ClipboardList size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Welcome to KP Discipleship</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Have you already completed any of these steps? Check them off and we'll mark them as self-reported for staff to review.
              </p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-500 transition-colors ml-2 shrink-0 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Steps */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {Object.entries(phases).map(([phaseNum, phase]) => (
            <div key={phaseNum}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                Phase {phaseNum} — {phase.name}
              </p>
              <div className="space-y-2">
                {phase.steps.map(step => (
                  <label
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors
                      ${selected.has(step.id) ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(step.id)}
                      onChange={() => toggle(step.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{step.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={saving || selected.size === 0}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving...' : selected.size > 0 ? `Save ${selected.size} step${selected.size > 1 ? 's' : ''}` : 'Select steps above'}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
