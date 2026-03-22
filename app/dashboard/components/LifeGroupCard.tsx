'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, ExternalLink } from 'lucide-react'
import { selfReportSteps } from '@/app/actions/progress'
import { DiscipleshipStepWithProgress } from '@/lib/services/progress'

interface Props {
  userId: string
  step: DiscipleshipStepWithProgress
}

export default function LifeGroupCard({ userId, step }: Props) {
  const isComplete = !!step.completion
  const [done, setDone] = useState(isComplete)
  const [pending, startTransition] = useTransition()

  function handleYes() {
    startTransition(async () => {
      await selfReportSteps(userId, [step.id], [])
      setDone(true)
    })
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-7 h-full flex flex-col gap-4">
        {done ? (
          <div className="flex flex-col items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">You're in a Life Group!</h2>
              <p className="text-blue-100 text-sm mt-1 leading-relaxed">
                Great — staying connected is one of the most important parts of your journey.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-bold text-white">Are you in a Life Group?</h2>
              <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
                Life Groups are the heartbeat of our community. Are you currently part of one?
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-auto">
              <button
                onClick={handleYes}
                disabled={pending}
                className="w-full bg-white text-blue-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors disabled:opacity-70"
              >
                {pending ? 'Saving…' : 'Yes, I'm in one'}
              </button>

              {step.action_cta_url && (
                <a
                  href={step.action_cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-white/15 text-white font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-white/25 transition-colors"
                >
                  {step.action_cta_text ?? 'I Want to Join'}
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
