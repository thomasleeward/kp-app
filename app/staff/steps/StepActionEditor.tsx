'use client'

import { useState, useTransition } from 'react'
import { updateStepAction } from '@/app/actions/steps'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  step: {
    id: string
    name: string
    stage?: string
    action_button_label: string | null
    action_info: string | null
    action_cta_text: string | null
    action_cta_url: string | null
  }
  type: 'discipleship' | 'leadership'
}

export default function StepActionEditor({ step, type }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const [buttonLabel, setButtonLabel] = useState(step.action_button_label ?? '')
  const [info, setInfo] = useState(step.action_info ?? '')
  const [ctaText, setCtaText] = useState(step.action_cta_text ?? '')
  const [ctaUrl, setCtaUrl] = useState(step.action_cta_url ?? '')

  const hasAction = !!step.action_button_label

  function handleSave() {
    startTransition(async () => {
      await updateStepAction(step.id, type, {
        action_button_label: buttonLabel,
        action_info: info,
        action_cta_text: ctaText,
        action_cta_url: ctaUrl,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="px-5 py-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{step.name}</span>
          {step.stage && (
            <span className="text-xs text-gray-400 capitalize">{step.stage}</span>
          )}
          {hasAction && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              {step.action_button_label}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Button label <span className="text-gray-400 font-normal">(shown on the step — leave blank to hide)</span>
            </label>
            <input
              type="text"
              value={buttonLabel}
              onChange={e => setButtonLabel(e.target.value)}
              placeholder="e.g. Sign Up"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Popup info text</label>
            <textarea
              value={info}
              onChange={e => setInfo(e.target.value)}
              placeholder="Describe what this step involves or how to complete it…"
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Popup button text</label>
              <input
                type="text"
                value={ctaText}
                onChange={e => setCtaText(e.target.value)}
                placeholder="e.g. Register Now"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Popup button link</label>
              <input
                type="url"
                value={ctaUrl}
                onChange={e => setCtaUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={pending}
              className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
            {saved && <span className="text-xs text-green-600">Saved</span>}
          </div>
        </div>
      )}
    </div>
  )
}
