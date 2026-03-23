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
      .select('full_name, leadership_interest_at, leadership_track_unlocked, baptism_date, self_report_seen_at')
      .eq('id', user.id)
      .single(),
    getDiscipleshipProgress(user.id),
    getLeadershipProgress(user.id),
    supabase.from('app_settings').select('value').eq('key', 'baptism_cta_url').single(),
  ])

  const lifeGroupStep = discipleshipProgress.find(s => s.name === 'Join a Life Group')
  const showSelfReport = !profile?.self_report_seen_at

  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  const completedSteps = discipleshipProgress.filter(s => s.completion && s.name !== 'Join a Life Group').length
  const totalSteps = discipleshipProgress.filter(s => s.name !== 'Join a Life Group').length
  const percent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      <Header name={profile?.full_name ?? ''} />

      {/* Hero greeting */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 px-4 pt-7 pb-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-300/70 text-sm font-medium mb-1">Welcome back{firstName ? `, ${firstName}` : ''}</p>
          <h1 className="text-2xl font-bold text-white mb-4">Your Journey</h1>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/10 rounded-full h-2">
              <div
                className="bg-blue-400 h-2 rounded-full transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-white/60 text-sm font-medium shrink-0">{percent}% complete</span>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 -mt-10 pb-8 max-w-5xl mx-auto w-full space-y-4">

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

      {showSelfReport && (
        <SelfReportModal
          userId={user.id}
          discipleshipSteps={discipleshipProgress}
          baptismDate={profile?.baptism_date ?? null}
        />
      )}
    </div>
  )
}
