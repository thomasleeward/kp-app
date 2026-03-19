'use client'

import { useTransition } from 'react'
import { unlockLeadershipTrack } from '@/app/actions/staff'
import { Unlock } from 'lucide-react'

export default function UnlockButton({ memberId }: { memberId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await unlockLeadershipTrack(memberId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-2 bg-indigo-600 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
    >
      <Unlock size={14} />
      {pending ? 'Unlocking...' : 'Unlock Leadership Track'}
    </button>
  )
}
