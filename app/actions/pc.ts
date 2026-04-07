'use server'

import { createClient } from '@/lib/supabase/server'
import {
  searchPeopleByEmail, searchPeopleByName, createPcPerson,
  importPersonProgress, importBaptismFromPC,
  syncStepCompletionToPC, syncBaptismToPC,
} from '@/lib/planning-center'
import { autoMarkGoTeamLeadership } from './staff'
import { revalidatePath } from 'next/cache'

export async function searchPcByEmail(email: string): Promise<import('@/lib/planning-center').PcPerson[]> {
  return await searchPeopleByEmail(email)
}

export async function searchPcByName(name: string): Promise<import('@/lib/planning-center').PcPerson[]> {
  return await searchPeopleByName(name)
}

// Push all existing app progress for a member to PC, then mark as linked
async function pushProgressToPC(supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>, userId: string, pcPersonId: string) {
  const [{ data: discProgress }, { data: leadProgress }, { data: profile }] = await Promise.all([
    supabase
      .from('member_discipleship_progress')
      .select('step_id, discipleship_steps(name)')
      .eq('user_id', userId),
    supabase
      .from('member_leadership_progress')
      .select('step_id, leadership_steps(name, level_name)')
      .eq('user_id', userId),
    supabase.from('profiles').select('baptism_date').eq('id', userId).single(),
  ])

  for (const row of discProgress ?? []) {
    const name = (row.discipleship_steps as any)?.name
    if (name) {
      try { await syncStepCompletionToPC(pcPersonId, name, 'discipleship') } catch {}
    }
  }

  for (const row of leadProgress ?? []) {
    const step = row.leadership_steps as any
    if (step?.name && step?.level_name) {
      try { await syncStepCompletionToPC(pcPersonId, `${step.level_name}: ${step.name}`, 'leadership') } catch {}
    }
  }

  if (profile?.baptism_date) {
    try { await syncBaptismToPC(pcPersonId, profile.baptism_date) } catch {}
  }
}

export async function linkMemberToPC(userId: string, pcPersonId: string) {
  const supabase = await createClient()

  await supabase
    .from('profiles')
    .update({ planning_center_id: pcPersonId, pc_link_status: 'linked' })
    .eq('id', userId)

  await pushProgressToPC(supabase, userId, pcPersonId)

  revalidatePath(`/staff/members/${userId}`)
  revalidatePath('/staff')
}

export async function createAndLinkPcProfile(userId: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .single()

  if (!profile) throw new Error('Member not found')

  const pcPersonId = await createPcPerson(profile.full_name, profile.email)

  await supabase
    .from('profiles')
    .update({ planning_center_id: pcPersonId, pc_link_status: 'linked' })
    .eq('id', userId)

  await pushProgressToPC(supabase, userId, pcPersonId)

  revalidatePath(`/staff/members/${userId}`)
  revalidatePath('/staff')
}

export async function refreshMemberFromPC(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staffRole } = await supabase
    .from('staff_roles').select('role').eq('user_id', user.id).single()
  if (!staffRole || staffRole.role === 'viewer') throw new Error('Insufficient permissions')

  const { data: profile } = await supabase
    .from('profiles')
    .select('planning_center_id')
    .eq('id', memberId)
    .single()

  if (!profile?.planning_center_id) throw new Error('Member is not linked to Planning Center')

  const pcPersonId = profile.planning_center_id

  const { completedDiscipleship, completedLeadership } = await importPersonProgress(pcPersonId)

  if (completedDiscipleship.length > 0) {
    const { data: discSteps } = await supabase.from('discipleship_steps').select('id, name')
    const discInserts = (discSteps ?? [])
      .filter(s => completedDiscipleship.some(n => n.toLowerCase() === s.name.toLowerCase()))
      .map(s => ({ user_id: memberId, step_id: s.id, completion_source: 'pc_synced' as const }))

    if (discInserts.length > 0) {
      await supabase
        .from('member_discipleship_progress')
        .upsert(discInserts, { onConflict: 'user_id,step_id', ignoreDuplicates: true })

      for (const s of discInserts) {
        const name = (discSteps ?? []).find(d => d.id === s.step_id)?.name ?? ''
        await autoMarkGoTeamLeadership(supabase, memberId, name, 'pc_synced')
      }
    }
  }

  if (completedLeadership.length > 0) {
    const { data: leadSteps } = await supabase.from('leadership_steps').select('id, name, level_name')
    const leadInserts = (leadSteps ?? [])
      .filter(s => completedLeadership.some(n => n.toLowerCase() === `${s.level_name}: ${s.name}`.toLowerCase()))
      .map(s => ({ user_id: memberId, step_id: s.id, completion_source: 'pc_synced' as const }))

    if (leadInserts.length > 0) {
      await supabase
        .from('member_leadership_progress')
        .upsert(leadInserts, { onConflict: 'user_id,step_id', ignoreDuplicates: true })
    }
  }

  const baptismDate = await importBaptismFromPC(pcPersonId)
  if (baptismDate) {
    const { data: existing } = await supabase
      .from('profiles').select('baptism_date').eq('id', memberId).single()
    if (!existing?.baptism_date) {
      await supabase.from('profiles').update({ baptism_date: baptismDate }).eq('id', memberId)
    }
  }

  revalidatePath(`/staff/members/${memberId}`)
}

export async function refreshOwnProfileFromPC() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('planning_center_id')
    .eq('id', user.id)
    .single()

  if (!profile?.planning_center_id) return

  const pcPersonId = profile.planning_center_id

  const { completedDiscipleship, completedLeadership } = await importPersonProgress(pcPersonId)

  if (completedDiscipleship.length > 0) {
    const { data: discSteps } = await supabase.from('discipleship_steps').select('id, name')
    const discInserts = (discSteps ?? [])
      .filter(s => completedDiscipleship.some(n => n.toLowerCase() === s.name.toLowerCase()))
      .map(s => ({ user_id: user.id, step_id: s.id, completion_source: 'pc_synced' as const }))

    if (discInserts.length > 0) {
      await supabase
        .from('member_discipleship_progress')
        .upsert(discInserts, { onConflict: 'user_id,step_id', ignoreDuplicates: true })

      for (const s of discInserts) {
        const name = (discSteps ?? []).find(d => d.id === s.step_id)?.name ?? ''
        await autoMarkGoTeamLeadership(supabase, user.id, name, 'pc_synced')
      }
    }
  }

  if (completedLeadership.length > 0) {
    const { data: leadSteps } = await supabase.from('leadership_steps').select('id, name, level_name')
    const leadInserts = (leadSteps ?? [])
      .filter(s => completedLeadership.some(n => n.toLowerCase() === `${s.level_name}: ${s.name}`.toLowerCase()))
      .map(s => ({ user_id: user.id, step_id: s.id, completion_source: 'pc_synced' as const }))

    if (leadInserts.length > 0) {
      await supabase
        .from('member_leadership_progress')
        .upsert(leadInserts, { onConflict: 'user_id,step_id', ignoreDuplicates: true })
    }
  }

  const baptismDate = await importBaptismFromPC(pcPersonId)
  if (baptismDate) {
    const { data: existing } = await supabase
      .from('profiles').select('baptism_date').eq('id', user.id).single()
    if (!existing?.baptism_date) {
      await supabase.from('profiles').update({ baptism_date: baptismDate }).eq('id', user.id)
    }
  }
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

      for (const s of discInserts) {
        const name = (discSteps ?? []).find(d => d.id === s.step_id)?.name ?? ''
        await autoMarkGoTeamLeadership(supabase, userId, name, 'pc_synced')
      }
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

  // Import baptism date from PC if set
  const baptismDate = await importBaptismFromPC(pcPersonId)
  if (baptismDate) {
    await supabase
      .from('profiles')
      .update({ baptism_date: baptismDate })
      .eq('id', userId)
  }

  revalidatePath('/dashboard')
}
