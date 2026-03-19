import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if staff
  const { data: staffRole } = await supabase
    .from('staff_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (staffRole) {
    redirect('/staff')
  }

  redirect('/dashboard')
}
