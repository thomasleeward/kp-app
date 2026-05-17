'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, ExternalLink } from 'lucide-react'
import { recordBaptism } from '@/app/actions/baptism'

interface Props {
  userId: string
  baptismDate: string | null
  ctaUrl: string | null
}

export default function BaptismCard({ userId, baptismDate, ctaUrl }: Props) {
  const [step, setStep] = useState<'ask' | 'date' | 'done'>(baptismDate ? 'done' : 'ask')
  const [date, setDate] = useState('')
  const [recordedDate, setRecordedDate] = useState(baptismDate)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    if (!date) return
    startTransition(async () => {
      await recordBaptism(userId, date)
      setRecordedDate(date)
      setStep('done')
    })
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-7 h-full flex flex-col gap-4">

        {step === 'done' && (
          <div className="flex flex-col items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Baptism recorded!</h2>
              <p className="text-blue-100 text-sm mt-1 leading-relaxed">
                {recordedDate
                  ? `Baptized on ${new Date(recordedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
                  : 'Thanks for letting us know.'}
              </p>
            </div>
          </div>
        )}

        {step === 'ask' && (
          <>
            <div>
              <h2 className="text-lg font-bold text-white">Have you been baptized?</h2>
              <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
                Baptism is a meaningful step in your faith journey. Let us know where you are.
              </p>
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              <button
                onClick={() => setStep('date')}
                className="w-full bg-white text-blue-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors"
              >
                Yes, I have been
              </button>
              {ctaUrl && (
                <a
                  href={ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-white/15 text-white font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-white/25 transition-colors"
                >
                  I Want to Get Baptized
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </>
        )}

        {step === 'date' && (
          <>
            <div>
              <h2 className="text-lg font-bold text-white">When were you baptized?</h2>
              <p className="text-blue-100 text-sm mt-1.5">Enter the date as best you can remember.</p>
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                onClick={handleConfirm}
                disabled={!date || pending}
                className="w-full bg-white text-blue-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {pending ? 'Saving…' : 'Confirm'}
              </button>
              <button
                onClick={() => setStep('ask')}
                className="text-blue-200 text-sm hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
