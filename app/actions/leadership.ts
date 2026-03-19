'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function expressLeadershipInterest(userId: string) {
  const supabase = await createClient()

  await supabase
    .from('profiles')
    .update({ leadership_interest_at: new Date().toISOString() })
    .eq('id', userId)

  // Create a notification record so staff can see it in the dashboard
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'leadership_interest',
    message: 'This member has expressed interest in the leadership track.',
  })

  revalidatePath('/dashboard')
}
