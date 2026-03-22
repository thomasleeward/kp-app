'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { syncBaptismToPC } from '@/lib/planning-center'

export async function recordBaptism(userId: string, date: string) {
  const supabase = await createClient()

  await supabase
    .from('profiles')
    .update({ baptism_date: date })
    .eq('id', userId)

  const { data: profile } = await supabase
    .from('profiles')
    .select('planning_center_id')
    .eq('id', userId)
    .single()

  if (profile?.planning_center_id) {
    try {
      await syncBaptismToPC(profile.planning_center_id, date)
    } catch (e) {
      console.error('PC baptism sync failed (non-blocking):', e)
    }
  }

  revalidatePath('/dashboard')
}

export async function updateBaptismCtaUrl(url: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: staffRole } = await supabase
    .from('staff_roles').select('role').eq('user_id', user.id).single()
  if (staffRole?.role !== 'admin') throw new Error('Admin only')

  await supabase
    .from('app_settings')
    .update({ value: url || null })
    .eq('key', 'baptism_cta_url')

  revalidatePath('/staff/steps')
}
