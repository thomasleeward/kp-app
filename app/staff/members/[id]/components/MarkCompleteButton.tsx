'use client'

import { useTransition } from 'react'
import { markDiscipleshipStepComplete, markLeadershipStepComplete } from '@/app/actions/staff'
import { CheckCircle2 } from 'lucide-react'

interface Props {
  memberId: string
  stepId: string
  type: 'discipleship' | 'leadership'
}

export default function MarkCompleteButton({ memberId, stepId, type }: Props) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      if (type === 'discipleship') {
        await markDiscipleshipStepComplete(memberId, stepId)
      } else {
        await markLeadershipStepComplete(memberId, stepId)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
    >
      <CheckCircle2 size={13} />
      {pending ? 'Saving...' : 'Mark complete'}
    </button>
  )
}
