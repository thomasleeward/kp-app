'use client'

import { useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { StepAction } from '@/lib/services/progress'

interface Props {
  stepName: string
  action: StepAction
}

export default function StepActionButton({ stepName, action }: Props) {
  const [open, setOpen] = useState(false)

  if (!action.action_button_label) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-0.5 rounded-full transition-colors shrink-0"
      >
        {action.action_button_label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-300 hover:text-gray-500"
            >
              <X size={18} />
            </button>

            <h3 className="font-semibold text-gray-900 mb-3">{stepName}</h3>

            {action.action_info && (
              <p className="text-sm text-gray-600 leading-relaxed mb-5 whitespace-pre-wrap">
                {action.action_info}
              </p>
            )}

            {action.action_cta_url && action.action_cta_text && (
              <a
                href={action.action_cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
              >
                {action.action_cta_text}
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </>
  )
}
