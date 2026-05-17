'use client'

import { useState, useTransition } from 'react'
import { makeMemberAdmin } from '@/app/actions/staff'
import { ShieldCheck } from 'lucide-react'

export default function MakeAdminButton({
  memberId,
  memberName,
}: {
  memberId: string
  memberName: string
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      try {
        await makeMemberAdmin(memberId)
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to make this member an admin.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-slate-900 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
      >
        <ShieldCheck size={14} />
        Make Admin
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-sm">
            <h2 className="font-semibold text-gray-900 mb-1">Make admin?</h2>
            <p className="text-sm text-gray-500 mb-5">
              This will give <span className="font-medium text-gray-700">{memberName}</span> full staff admin access.
            </p>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">
                {error}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={pending}
                className="px-4 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl disabled:opacity-50 transition-colors"
              >
                {pending ? 'Saving...' : 'Yes, make admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
