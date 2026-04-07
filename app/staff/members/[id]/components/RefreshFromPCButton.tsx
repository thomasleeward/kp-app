'use client'

import { useTransition } from 'react'
import { refreshMemberFromPC } from '@/app/actions/pc'
import { RefreshCw } from 'lucide-react'

export default function RefreshFromPCButton({ memberId }: { memberId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await refreshMemberFromPC(memberId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 ring-1 ring-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
    >
      <RefreshCw size={13} className={pending ? 'animate-spin' : ''} />
      {pending ? 'Refreshing...' : 'Refresh from PC'}
    </button>
  )
}
