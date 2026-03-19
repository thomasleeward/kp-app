import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDiscipleshipProgress, getLeadershipProgress } from '@/lib/services/progress'
import Header from './components/Header'
import DiscipleshipPath from './components/DiscipleshipPath'
import LeadershipCard from './components/LeadershipCard'
import SelfReportModal from './components/SelfReportModal'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, discipleshipProgress, leadershipProgress] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, leadership_interest_at, leadership_track_unlocked')
      .eq('id', user.id)
      .single(),
    getDiscipleshipProgress(user.id),
    getLeadershipProgress(user.id),
  ])

  const hasAnyProgress = discipleshipProgress.some(s => s.completion)

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      <Header name={profile?.full_name ?? ''} />

      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full space-y-4">
        <div className="mb-2">
          <h1 className="text-xl font-bold text-gray-900">Your Journey</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track your discipleship and leadership progress</p>
        </div>

        <DiscipleshipPath steps={discipleshipProgress} />

        <LeadershipCard
          userId={user.id}
          trackUnlocked={profile?.leadership_track_unlocked ?? false}
          alreadyInterested={!!profile?.leadership_interest_at}
          steps={leadershipProgress}
        />
      </main>

      {!hasAnyProgress && (
        <SelfReportModal
          userId={user.id}
          discipleshipSteps={discipleshipProgress}
        />
      )}
    </div>
  )
}
