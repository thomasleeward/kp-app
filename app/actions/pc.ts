'use server'

import { createClient } from '@/lib/supabase/server'
import {
  searchPeopleByEmail, searchPeopleByName, createPcPerson,
  importPersonProgress, importBaptismFromPC, importGoTeamsFromPC, importTagsFromPC,
  getTagOptionsFromPC, isGoTeamsSyncConfigured, isTagsSyncConfigured, syncTagToPC, unsyncTagFromPC,
  syncStepCompletionToPC, syncBaptismToPC,
} from '@/lib/planning-center'
import { revalidatePath } from 'next/cache'

interface DiscipleshipProgressRow {
  discipleship_steps?: { name?: string } | { name?: string }[] | null
}

interface LeadershipProgressRow {
  leadership_steps?: { name?: string; level_name?: string } | { name?: string; level_name?: string }[] | null
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null
}

export async function searchPcByEmail(email: string): Promise<import('@/lib/planning-center').PcPerson[]> {
  return await searchPeopleByEmail(email)
}

export async function searchPcByName(name: string): Promise<import('@/lib/planning-center').PcPerson[]> {
  return await searchPeopleByName(name)
}

export async function getTagOptions(): Promise<string[]> {
  return await getTagOptionsFromPC()
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

  for (const row of (discProgress ?? []) as DiscipleshipProgressRow[]) {
    const name = firstRelation(row.discipleship_steps)?.name
    if (name) {
      try { await syncStepCompletionToPC(pcPersonId, name, 'discipleship') } catch {}
    }
  }

  for (const row of (leadProgress ?? []) as LeadershipProgressRow[]) {
    const step = firstRelation(row.leadership_steps)
    if (step?.name && step?.level_name) {
      try { await syncStepCompletionToPC(pcPersonId, `${step.level_name}: ${step.name}`, 'leadership') } catch {}
    }
  }

  if (profile?.baptism_date) {
    try { await syncBaptismToPC(pcPersonId, profile.baptism_date) } catch {}
  }
}

async function syncGoTeamsFromPC(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  userId: string,
  pcPersonId: string
) {
  if (!isGoTeamsSyncConfigured()) return

  const goTeams = await importGoTeamsFromPC(pcPersonId)

  await supabase
    .from('profiles')
    .update({ go_teams: goTeams })
    .eq('id', userId)
}

async function syncTagsFromPC(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  userId: string,
  pcPersonId: string
) {
  if (!isTagsSyncConfigured()) return

  const tags = await importTagsFromPC(pcPersonId)

  await supabase
    .from('profiles')
    .update({ tags })
    .eq('id', userId)
}

async function requireEditorForMember(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staffRole } = await supabase
    .from('staff_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!staffRole || staffRole.role === 'viewer') {
    throw new Error('Insufficient permissions')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('planning_center_id')
    .eq('id', memberId)
    .single()

  if (!profile?.planning_center_id) throw new Error('Member is not linked to Planning Center')

  return { supabase, pcPersonId: profile.planning_center_id }
}

async function mirrorProgressFromPC(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  userId: string,
  pcPersonId: string
) {
  const progress = await importPersonProgress(pcPersonId)
  if (!progress.imported) throw new Error('Unable to import Planning Center progress')

  const [{ data: discSteps }, { data: leadSteps }] = await Promise.all([
    supabase.from('discipleship_steps').select('id, name'),
    supabase.from('leadership_steps').select('id, name, level_name'),
  ])

  const completedDiscipleshipNames = new Set(
    progress.completedDiscipleship.map(name => name.toLowerCase())
  )
  const completedLeadershipNames = new Set(
    progress.completedLeadership.map(name => name.toLowerCase())
  )

  const discInserts = (discSteps ?? [])
    .filter(step => completedDiscipleshipNames.has(step.name.toLowerCase()))
    .map(step => ({
      user_id: userId,
      step_id: step.id,
      completion_source: 'pc_synced' as const,
      completed_at: new Date().toISOString(),
    }))

  const leadInserts = (leadSteps ?? [])
    .filter(step => completedLeadershipNames.has(`${step.level_name}: ${step.name}`.toLowerCase()))
    .map(step => ({
      user_id: userId,
      step_id: step.id,
      completion_source: 'pc_synced' as const,
      completed_at: new Date().toISOString(),
    }))

  await Promise.all([
    supabase.from('member_discipleship_progress').delete().eq('user_id', userId),
    supabase.from('member_leadership_progress').delete().eq('user_id', userId),
  ])

  if (discInserts.length > 0) {
    await supabase
      .from('member_discipleship_progress')
      .insert(discInserts)
  }

  if (leadInserts.length > 0) {
    await supabase
      .from('member_leadership_progress')
      .insert(leadInserts)
  }

}

export async function linkMemberToPC(userId: string, pcPersonId: string) {
  const supabase = await createClient()

  await supabase
    .from('profiles')
    .update({ planning_center_id: pcPersonId, pc_link_status: 'linked' })
    .eq('id', userId)

  await pushProgressToPC(supabase, userId, pcPersonId)
  await syncGoTeamsFromPC(supabase, userId, pcPersonId)
  await syncTagsFromPC(supabase, userId, pcPersonId)

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
  await syncGoTeamsFromPC(supabase, userId, pcPersonId)
  await syncTagsFromPC(supabase, userId, pcPersonId)

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

  await mirrorProgressFromPC(supabase, memberId, pcPersonId)
  await syncGoTeamsFromPC(supabase, memberId, pcPersonId)
  await syncTagsFromPC(supabase, memberId, pcPersonId)

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

  await mirrorProgressFromPC(supabase, user.id, pcPersonId)
  await syncGoTeamsFromPC(supabase, user.id, pcPersonId)
  await syncTagsFromPC(supabase, user.id, pcPersonId)

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
  await mirrorProgressFromPC(supabase, userId, pcPersonId)
  await syncGoTeamsFromPC(supabase, userId, pcPersonId)
  await syncTagsFromPC(supabase, userId, pcPersonId)

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

export async function addMemberTag(memberId: string, tag: string) {
  const { supabase, pcPersonId } = await requireEditorForMember(memberId)

  await syncTagToPC(pcPersonId, tag)
  await syncTagsFromPC(supabase, memberId, pcPersonId)

  revalidatePath(`/staff/members/${memberId}`)
  revalidatePath('/staff')
}

export async function removeMemberTag(memberId: string, tag: string) {
  const { supabase, pcPersonId } = await requireEditorForMember(memberId)

  await unsyncTagFromPC(pcPersonId, tag)
  await syncTagsFromPC(supabase, memberId, pcPersonId)

  revalidatePath(`/staff/members/${memberId}`)
  revalidatePath('/staff')
}
