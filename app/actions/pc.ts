'use server'

import { createClient } from '@/lib/supabase/server'
import { searchPeopleByEmail, importPersonProgress } from '@/lib/planning-center'
import { revalidatePath } from 'next/cache'

export async function searchPcByEmail(email: string): Promise<import('@/lib/planning-center').PcPerson[]> {
  return await searchPeopleByEmail(email)
}

export async function linkAndImportPcProfile(userId: string, pcPersonId: string) {
  const supabase = await createClient()

  // Store the PC person ID on the profile
  await supabase
    .from('profiles')
    .update({ planning_center_id: pcPersonId, pc_link_status: 'linked' })
    .eq('id', userId)

  // Pull their existing workflow progress from PC
  const { completedDiscipleship, completedLeadership } = await importPersonProgress(pcPersonId)

  if (completedDiscipleship.length > 0) {
    // Match PC step names to our step IDs
    const { data: discSteps } = await supabase
      .from('discipleship_steps')
      .select('id, name')

    const discInserts = (discSteps ?? [])
      .filter(s => completedDiscipleship.some(
        n => n.toLowerCase() === s.name.toLowerCase()
      ))
      .map(s => ({
        user_id: userId,
        step_id: s.id,
        completion_source: 'pc_synced' as const,
      }))

    if (discInserts.length > 0) {
      await supabase
        .from('member_discipleship_progress')
        .upsert(discInserts, { onConflict: 'user_id,step_id' })
    }
  }

  if (completedLeadership.length > 0) {
    const { data: leadSteps } = await supabase
      .from('leadership_steps')
      .select('id, name, level_name')

    const leadInserts = (leadSteps ?? [])
      .filter(s => completedLeadership.some(
        n => n.toLowerCase() === `${s.level_name}: ${s.name}`.toLowerCase()
      ))
      .map(s => ({
        user_id: userId,
        step_id: s.id,
        completion_source: 'pc_synced' as const,
      }))

    if (leadInserts.length > 0) {
      await supabase
        .from('member_leadership_progress')
        .upsert(leadInserts, { onConflict: 'user_id,step_id' })
    }
  }

  revalidatePath('/dashboard')
}
