'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function selfReportSteps(
  userId: string,
  discipleshipStepIds: string[],
  leadershipStepIds: string[]
) {
  const supabase = await createClient()

  if (discipleshipStepIds.length > 0) {
    await supabase.from('member_discipleship_progress').insert(
      discipleshipStepIds.map(stepId => ({
        user_id: userId,
        step_id: stepId,
        completion_source: 'self_reported',
      }))
    )
  }

  if (leadershipStepIds.length > 0) {
    await supabase.from('member_leadership_progress').insert(
      leadershipStepIds.map(stepId => ({
        user_id: userId,
        step_id: stepId,
        completion_source: 'self_reported',
      }))
    )
  }

  revalidatePath('/dashboard')
}
