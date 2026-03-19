'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { unlockLeadershipTrack } from '@/app/actions/staff'
import { Unlock, ChevronRight } from 'lucide-react'

export interface LeadershipRequest {
  id: string
  full_name: string
  email: string | null
  leadership_interest_at: string
}

export default function LeadershipRequests({ requests }: { requests: LeadershipRequest[] }) {
  if (requests.length === 0) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-amber-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Leadership Interest</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {requests.length} member{requests.length !== 1 ? 's' : ''} want{requests.length === 1 ? 's' : ''} to start the leadership track
          </p>
        </div>
        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
          {requests.length}
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {requests.map(req => (
          <RequestRow key={req.id} request={req} />
        ))}
      </div>
    </div>
  )
}

function RequestRow({ request }: { request: LeadershipRequest }) {
  const [pending, startTransition] = useTransition()

  const date = new Date(request.leadership_interest_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  })

  function handleUnlock() {
    startTransition(async () => {
      await unlockLeadershipTrack(request.id)
    })
  }

  return (
    <div className="flex items-center justify-between px-5 py-3.5 gap-3">
      <Link href={`/staff/members/${request.id}`} className="flex-1 min-w-0 hover:opacity-70 transition-opacity">
        <p className="text-sm font-medium text-gray-900">{request.full_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">Expressed interest {date}</p>
      </Link>
      <button
        onClick={handleUnlock}
        disabled={pending}
        className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
      >
        <Unlock size={12} />
        {pending ? 'Unlocking...' : 'Unlock Track'}
      </button>
    </div>
  )
}
