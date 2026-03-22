'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteMemberProfile } from '@/app/actions/staff'
import { Trash2 } from 'lucide-react'

export default function DeleteMemberButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleConfirm() {
    startTransition(async () => {
      await deleteMemberProfile(memberId)
      router.push('/staff')
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors"
      >
        <Trash2 size={14} />
        Remove member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-sm">
            <h2 className="font-semibold text-gray-900 mb-1">Remove member?</h2>
            <p className="text-sm text-gray-500 mb-5">
              This will permanently delete <span className="font-medium text-gray-700">{memberName}</span>'s
              account and all their progress data. This cannot be undone.
            </p>
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
                className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-xl disabled:opacity-50 transition-colors"
              >
                {pending ? 'Removing...' : 'Yes, remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
