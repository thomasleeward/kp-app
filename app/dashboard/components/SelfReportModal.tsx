'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { selfReportSteps, dismissSelfReport } from '@/app/actions/progress'
import { recordBaptism } from '@/app/actions/baptism'
import { DiscipleshipStepWithProgress } from '@/lib/services/progress'
import { X, ClipboardList, Droplets, CheckCircle2 } from 'lucide-react'

interface Props {
  userId: string
  discipleshipSteps: DiscipleshipStepWithProgress[]
  baptismDate: string | null
}

export default function SelfReportModal({ userId, discipleshipSteps, baptismDate }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [baptized, setBaptized] = useState<boolean | null>(baptismDate ? true : null)
  const [baptismDateInput, setBaptismDateInput] = useState(baptismDate ?? '')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const alreadyOnRecord = discipleshipSteps.filter(s => s.completion)
  const needsReporting = discipleshipSteps.filter(s => !s.completion)

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSubmit() {
    setSaving(true)
    if (selected.size > 0) {
      await selfReportSteps(userId, [...selected], [])
    }
    if (baptized && baptismDateInput && !baptismDate) {
      await recordBaptism(userId, baptismDateInput)
    }
    await dismissSelfReport(userId)
    setOpen(false)
    router.refresh()
  }

  async function handleDismiss() {
    await dismissSelfReport(userId)
    setOpen(false)
    router.refresh()
  }

  const phases = needsReporting.reduce<Record<number, { name: string; steps: DiscipleshipStepWithProgress[] }>>(
    (acc, step) => {
      if (!acc[step.phase]) acc[step.phase] = { name: step.phase_name, steps: [] }
      acc[step.phase].steps.push(step)
      return acc
    },
    {}
  )

  const canSave = selected.size > 0 || (baptized && baptismDateInput && !baptismDate)

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
                {alreadyOnRecord.length > 0
                  ? "Here's what we already have on file. Check off anything else you've completed."
                  : "Have you already completed any of these steps? Check them off and we'll mark them for staff to review."}
              </p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-gray-300 hover:text-gray-500 transition-colors ml-2 shrink-0 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Steps */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Already on record */}
          {alreadyOnRecord.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-2.5">Already on record</p>
              <div className="space-y-2">
                {alreadyOnRecord.map(step => (
                  <div key={step.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-50">
                    <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                    <span className="text-sm text-gray-700">{step.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps to self-report */}
          {needsReporting.length > 0 && (
            <div className="space-y-5">
              {alreadyOnRecord.length > 0 && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Anything else?</p>
              )}
              {Object.entries(phases).map(([phaseNum, phase]) => (
                <div key={phaseNum}>
                  {alreadyOnRecord.length === 0 && (
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                      Phase {phaseNum} — {phase.name}
                    </p>
                  )}
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
          )}

          {/* Baptism */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={15} className="text-blue-400" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Baptism</p>
            </div>
            {baptismDate ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <span className="text-sm text-gray-700">
                  Baptized on {new Date(baptismDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">Have you been baptized?</p>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setBaptized(true)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      baptized === true ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBaptized(false); setBaptismDateInput('') }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      baptized === false ? 'bg-gray-200 text-gray-700' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    No
                  </button>
                </div>
                {baptized && (
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Baptism date</label>
                    <input
                      type="date"
                      value={baptismDateInput}
                      onChange={e => setBaptismDateInput(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={saving || !canSave}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving...' : canSave ? `Save ${selected.size > 0 ? `${selected.size} step${selected.size > 1 ? 's' : ''}` : 'baptism'}` : 'Nothing to add'}
          </button>
          <button
            onClick={handleDismiss}
            disabled={saving}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {canSave ? 'Skip' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
