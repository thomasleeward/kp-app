'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { syncStepCompletionToPC } from '@/lib/planning-center'

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

  // Sync to Planning Center if the user has a linked profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('planning_center_id')
    .eq('id', userId)
    .single()

  if (profile?.planning_center_id) {
    const pcId = profile.planning_center_id

    if (discipleshipStepIds.length > 0) {
      const { data: discSteps } = await supabase
        .from('discipleship_steps')
        .select('id, name')
        .in('id', discipleshipStepIds)

      for (const step of discSteps ?? []) {
        try {
          await syncStepCompletionToPC(pcId, step.name, 'discipleship')
        } catch (e) {
          console.error('PC sync failed (non-blocking):', e)
        }
      }
    }

    if (leadershipStepIds.length > 0) {
      const { data: leadSteps } = await supabase
        .from('leadership_steps')
        .select('id, name, level_name')
        .in('id', leadershipStepIds)

      for (const step of leadSteps ?? []) {
        try {
          await syncStepCompletionToPC(pcId, `${step.level_name}: ${step.name}`, 'leadership')
        } catch (e) {
          console.error('PC sync failed (non-blocking):', e)
        }
      }
    }
  }

  revalidatePath('/dashboard')
}
