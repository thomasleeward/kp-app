'use client'

import { useState, useTransition } from 'react'
import { updateBaptismCtaUrl } from '@/app/actions/baptism'

export default function BaptismUrlEditor({ currentUrl }: { currentUrl: string }) {
  const [url, setUrl] = useState(currentUrl)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSave() {
    startTransition(async () => {
      await updateBaptismCtaUrl(url)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-800">Baptism card — "I Want to Get Baptized" link</p>
        <p className="text-xs text-gray-400 mt-0.5">The URL members are sent to when they click the button on the Baptism card.</p>
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://…"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSave}
          disabled={pending}
          className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="text-xs text-green-600 self-center">Saved</span>}
      </div>
    </div>
  )
}
