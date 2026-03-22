'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staffRole } = await supabase
    .from('staff_roles').select('role').eq('user_id', user.id).single()
  if (staffRole?.role !== 'admin') throw new Error('Admin only')

  return supabase
}

export async function updateStepAction(
  stepId: string,
  type: 'discipleship' | 'leadership',
  data: {
    action_button_label: string
    action_info: string
    action_cta_text: string
    action_cta_url: string
  }
) {
  const supabase = await requireAdmin()
  const table = type === 'discipleship' ? 'discipleship_steps' : 'leadership_steps'

  // Store nulls for empty strings so the button doesn't show if not configured
  await supabase.from(table).update({
    action_button_label: data.action_button_label || null,
    action_info: data.action_info || null,
    action_cta_text: data.action_cta_text || null,
    action_cta_url: data.action_cta_url || null,
  }).eq('id', stepId)

  revalidatePath('/dashboard')
  revalidatePath('/staff/steps')
}
