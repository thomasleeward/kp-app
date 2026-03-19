'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendStepCompleteEmail, sendLeadershipUnlockedEmail } from '@/lib/email'

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

  revalidatePath(`/staff/members/${memberId}`)
  revalidatePath('/staff')
}

export async function markLeadershipStepComplete(memberId: string, stepId: string) {
  const { supabase, staffUserId } = await requireEditor()

  const [{ data: step }, { data: member }, { data: staffProfile }] = await Promise.all([
    supabase.from('leadership_steps').select('name').eq('id', stepId).single(),
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
