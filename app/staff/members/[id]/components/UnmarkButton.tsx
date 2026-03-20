'use client'

import { useTransition } from 'react'
import { unmarkDiscipleshipStep, unmarkLeadershipStep } from '@/app/actions/staff'
import { X } from 'lucide-react'

interface Props {
  memberId: string
  stepId: string
  type: 'discipleship' | 'leadership'
}

export default function UnmarkButton({ memberId, stepId, type }: Props) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      if (type === 'discipleship') {
        await unmarkDiscipleshipStep(memberId, stepId)
      } else {
        await unmarkLeadershipStep(memberId, stepId)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
      title="Unmark complete"
    >
      <X size={13} />
      {pending ? 'Removing...' : 'Unmark'}
    </button>
  )
}
