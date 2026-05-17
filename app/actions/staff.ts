'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendStepCompleteEmail, sendLeadershipUnlockedEmail } from '@/lib/email'
import { syncStepCompletionToPC, unsyncStepFromPC } from '@/lib/planning-center'

// When "Join the Go Team" is completed on discipleship, auto-mark the matching leadership step
const GO_TEAM_DISC_NAME = 'Join the Go Team'

export async function autoMarkGoTeamLeadership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberId: string,
  discStepName: string,
  source: 'staff_confirmed' | 'self_reported' | 'pc_synced',
  completedBy?: string
) {
  if (discStepName.toLowerCase() !== GO_TEAM_DISC_NAME.toLowerCase()) return

  const { data: leadStep } = await supabase
    .from('leadership_steps')
    .select('id')
    .eq('name', 'Join the Go Team')
    .eq('level_name', 'Member')
    .single()

  if (!leadStep) return

  await supabase.from('member_leadership_progress').upsert({
    user_id: memberId,
    step_id: leadStep.id,
    completion_source: source,
    ...(completedBy ? { completed_by: completedBy } : {}),
    completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,step_id' })
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staffRole } = await supabase
    .from('staff_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (staffRole?.role !== 'admin') throw new Error('Admin only')

  return { supabase, staffUserId: user.id }
}

export async function makeMemberAdmin(memberId: string) {
  const { supabase } = await requireAdmin()

  const { data: member } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', memberId)
    .single()

  if (!member) throw new Error('Member not found')

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('staff_roles')
    .upsert({ user_id: memberId, role: 'admin' }, { onConflict: 'user_id' })

  if (error) throw new Error(`Failed to make member admin: ${error.message}`)

  revalidatePath('/staff')
  revalidatePath(`/staff/members/${memberId}`)
}

async function requireEditor() {
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

  return { supabase, staffUserId: user.id }
}

export async function markDiscipleshipStepComplete(memberId: string, stepId: string) {
  const { supabase, staffUserId } = await requireEditor()

  const [{ data: step }, { data: member }, { data: staffProfile }] = await Promise.all([
    supabase.from('discipleship_steps').select('name').eq('id', stepId).single(),
    supabase.from('profiles').select('full_name, email').eq('id', memberId).single(),
    supabase.from('profiles').select('full_name').eq('id', staffUserId).single(),
  ])

  await supabase.from('member_discipleship_progress').upsert({
    user_id: memberId,
    step_id: stepId,
    completion_source: 'staff_confirmed',
    completed_by: staffUserId,
    completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,step_id' })

  if (step?.name) {
    await autoMarkGoTeamLeadership(supabase, memberId, step.name, 'staff_confirmed', staffUserId)
  }

  if (member?.email && step?.name) {
    try {
      await sendStepCompleteEmail(
        member.email,
        member.full_name,
        step.name,
        staffProfile?.full_name ?? 'A staff member'
      )
    } catch (e) {
      console.error('Email failed (non-blocking):', e)
    }
  }

  // Write-back to Planning Center if the member has a linked PC profile
  const { data: memberProfile } = await supabase
    .from('profiles')
    .select('planning_center_id')
    .eq('id', memberId)
    .single()

  if (memberProfile?.planning_center_id && step?.name) {
    try {
      await syncStepCompletionToPC(memberProfile.planning_center_id, step.name, 'discipleship')
    } catch (e) {
      console.error('PC sync failed (non-blocking):', e)
    }
  }

  revalidatePath(`/staff/members/${memberId}`)
  revalidatePath('/staff')
}

export async function markLeadershipStepComplete(memberId: string, stepId: string) {
  const { supabase, staffUserId } = await requireEditor()

  const [{ data: step }, { data: member }, { data: staffProfile }] = await Promise.all([
    supabase.from('leadership_steps').select('name, level_name').eq('id', stepId).single(),
    supabase.from('profiles').select('full_name, email').eq('id', memberId).single(),
    supabase.from('profiles').select('full_name').eq('id', staffUserId).single(),
  ])

  await supabase.from('member_leadership_progress').upsert({
    user_id: memberId,
    step_id: stepId,
    completion_source: 'staff_confirmed',
    completed_by: staffUserId,
    completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,step_id' })

  if (member?.email && step?.name) {
    try {
      await sendStepCompleteEmail(
        member.email,
        member.full_name,
        step.name,
        staffProfile?.full_name ?? 'A staff member'
      )
    } catch (e) {
      console.error('Email failed (non-blocking):', e)
    }
  }

  // Write-back to Planning Center
  const { data: memberProfile } = await supabase
    .from('profiles')
    .select('planning_center_id')
    .eq('id', memberId)
    .single()

  if (memberProfile?.planning_center_id && step?.name && step?.level_name) {
    try {
      await syncStepCompletionToPC(
        memberProfile.planning_center_id,
        `${step.level_name}: ${step.name}`,
        'leadership'
      )
    } catch (e) {
      console.error('PC sync failed (non-blocking):', e)
    }
  }

  revalidatePath(`/staff/members/${memberId}`)
  revalidatePath('/staff')
}

export async function unlockLeadershipTrack(memberId: string) {
  const { supabase } = await requireEditor()

  const { data: member } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', memberId)
    .single()

  await supabase
    .from('profiles')
    .update({ leadership_track_unlocked: true })
    .eq('id', memberId)

  if (member?.email) {
    try {
      await sendLeadershipUnlockedEmail(member.email, member.full_name)
    } catch (e) {
      console.error('Email failed (non-blocking):', e)
    }
  }

  revalidatePath('/staff')
  revalidatePath(`/staff/members/${memberId}`)
}

export async function unmarkDiscipleshipStep(memberId: string, stepId: string) {
  const { supabase } = await requireEditor()

  const { data: step } = await supabase
    .from('discipleship_steps').select('name').eq('id', stepId).single()

  await supabase
    .from('member_discipleship_progress')
    .delete()
    .eq('user_id', memberId)
    .eq('step_id', stepId)

  const { data: memberProfile } = await supabase
    .from('profiles').select('planning_center_id').eq('id', memberId).single()

  if (memberProfile?.planning_center_id && step?.name) {
    try {
      await unsyncStepFromPC(memberProfile.planning_center_id, step.name, 'discipleship')
    } catch (e) {
      console.error('PC unsync failed (non-blocking):', e)
    }
  }

  revalidatePath(`/staff/members/${memberId}`)
  revalidatePath('/staff')
}

export async function deleteMemberProfile(memberId: string) {
  const { staffUserId } = await requireAdmin()
  if (memberId === staffUserId) throw new Error('You cannot remove your own account.')

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Add it to the server environment to remove members.')
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(memberId)
  if (error) throw new Error(`Failed to delete user: ${error.message}`)

  revalidatePath('/staff')
}

export async function unmarkLeadershipStep(memberId: string, stepId: string) {
  const { supabase } = await requireEditor()

  const { data: step } = await supabase
    .from('leadership_steps').select('name, level_name').eq('id', stepId).single()

  await supabase
    .from('member_leadership_progress')
    .delete()
    .eq('user_id', memberId)
    .eq('step_id', stepId)

  const { data: memberProfile } = await supabase
    .from('profiles').select('planning_center_id').eq('id', memberId).single()

  if (memberProfile?.planning_center_id && step?.name && step?.level_name) {
    try {
      await unsyncStepFromPC(
        memberProfile.planning_center_id,
        `${step.level_name}: ${step.name}`,
        'leadership'
      )
    } catch (e) {
      console.error('PC unsync failed (non-blocking):', e)
    }
  }

  revalidatePath(`/staff/members/${memberId}`)
  revalidatePath('/staff')
}
