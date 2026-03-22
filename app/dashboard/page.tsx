import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDiscipleshipProgress, getLeadershipProgress } from '@/lib/services/progress'
import Header from './components/Header'
import DiscipleshipPath from './components/DiscipleshipPath'
import LeadershipCard from './components/LeadershipCard'
import LifeGroupCard from './components/LifeGroupCard'
import BaptismCard from './components/BaptismCard'
import SelfReportModal from './components/SelfReportModal'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, discipleshipProgress, leadershipProgress, { data: baptismSetting }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, leadership_interest_at, leadership_track_unlocked, baptism_date')
      .eq('id', user.id)
      .single(),
    getDiscipleshipProgress(user.id),
    getLeadershipProgress(user.id),
    supabase.from('app_settings').select('value').eq('key', 'baptism_cta_url').single(),
  ])

  const lifeGroupStep = discipleshipProgress.find(s => s.name === 'Join a Life Group')
  const hasAnyProgress = discipleshipProgress.some(s => s.completion)

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      <Header name={profile?.full_name ?? ''} />

      <main className="flex-1 px-4 py-8 max-w-5xl mx-auto w-full space-y-4">
        <div className="mb-2">
          <h1 className="text-xl font-bold text-gray-900">Your Journey</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track your discipleship and leadership progress</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2">
            <DiscipleshipPath steps={discipleshipProgress} />
          </div>
          {(lifeGroupStep || true) && (
            <div className="lg:col-span-1 flex flex-col gap-4">
              {lifeGroupStep && (
                <LifeGroupCard userId={user.id} step={lifeGroupStep} />
              )}
              <BaptismCard
                userId={user.id}
                baptismDate={profile?.baptism_date ?? null}
                ctaUrl={baptismSetting?.value ?? null}
              />
            </div>
          )}
        </div>

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
