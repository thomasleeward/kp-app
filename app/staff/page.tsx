import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StaffHeader from './components/StaffHeader'
import MemberList, { MemberRow } from './components/MemberList'
import LeadershipRequests, { LeadershipRequest } from './components/LeadershipRequests'
import { Users, CheckCircle2, BookOpen, Flame, Settings, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: staffRole } = await supabase
    .from('staff_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (!staffRole) redirect('/dashboard')

  const { data: staffProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Fetch all data in parallel
  const [
    { data: profiles },
    { data: discSteps },
    { data: discProgress },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, created_at, leadership_interest_at, leadership_track_unlocked, baptism_date, pc_link_status, go_teams')
      .order('full_name'),
    supabase
      .from('discipleship_steps')
      .select('id, name, phase, phase_name, step_order')
      .order('phase')
      .order('step_order'),
    supabase
      .from('member_discipleship_progress')
      .select('user_id, step_id'),
  ])

  const allProfiles = profiles ?? []
  const allSteps = discSteps ?? []
  const allProgress = discProgress ?? []
  const lifeGroupStepId = allSteps.find(s => s.name === 'Join a Life Group')?.id

  // Per-phase completion stats (exclude Life Group step)
  const countableSteps = allSteps.filter(s => s.name !== 'Join a Life Group')
  const phaseStats = Object.values(
    countableSteps.reduce<Record<number, { name: string; stepIds: string[] }>>((acc, step) => {
      if (!acc[step.phase]) acc[step.phase] = { name: step.phase_name, stepIds: [] }
      acc[step.phase].stepIds.push(step.id)
      return acc
    }, {})
  ).map(({ name, stepIds }) => {
    const completed = allProfiles.filter(profile => {
      const memberStepIds = new Set(allProgress.filter(p => p.user_id === profile.id).map(p => p.step_id))
      return stepIds.every(id => memberStepIds.has(id))
    }).length
    return { name, completed, total: allProfiles.length }
  })

  // Compute per-member stats
  const memberRows: MemberRow[] = allProfiles.map(profile => {
    const completed = allProgress.filter(p => p.user_id === profile.id).map(p => p.step_id)
    const completedSet = new Set(completed)

    // Current phase: lowest phase with incomplete steps
    const phaseGroups: Record<number, { name: string; ids: string[] }> = {}
    for (const step of allSteps) {
      if (!phaseGroups[step.phase]) phaseGroups[step.phase] = { name: step.phase_name, ids: [] }
      phaseGroups[step.phase].ids.push(step.id)
    }
    let currentPhase = 'Not started'
    for (const [num, { name, ids }] of Object.entries(phaseGroups)) {
      if (!ids.every(id => completedSet.has(id))) {
        currentPhase = completed.length === 0 ? 'Not started' : `Phase ${num}: ${name}`
        break
      }
      currentPhase = 'Path complete'
    }

    return {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      created_at: profile.created_at,
      discCompleted: completed.length,
      discTotal: allSteps.length,
      currentPhase,
      leadershipStatus: profile.leadership_track_unlocked
        ? 'unlocked'
        : profile.leadership_interest_at
          ? 'interested'
          : 'none',
      inLifeGroup: lifeGroupStepId ? completedSet.has(lifeGroupStepId) : false,
      baptized: !!profile.baptism_date,
      pcLinked: profile.pc_link_status === 'linked',
      goTeams: Array.isArray(profile.go_teams) ? profile.go_teams.filter(Boolean) : [],
    }
  })

  // Stats
  const totalMembers = allProfiles.length
  const activeMembers = memberRows.filter(m => m.discCompleted > 0).length
  const completedPath = memberRows.filter(m => m.currentPhase === 'Path complete').length
  const pendingLeadership = allProfiles.filter(
    p => p.leadership_interest_at && !p.leadership_track_unlocked
  ).length

  // Leadership requests
  const leadershipRequests: LeadershipRequest[] = allProfiles
    .filter(p => p.leadership_interest_at && !p.leadership_track_unlocked)
    .map(p => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      leadership_interest_at: p.leadership_interest_at!,
    }))

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      <StaffHeader name={staffProfile?.full_name ?? ''} role={staffRole.role} />

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 px-4 pt-7 pb-16">
        <div className="max-w-5xl mx-auto flex items-start justify-between">
          <div>
            <p className="text-blue-300/70 text-sm font-medium mb-1">King&apos;s Park</p>
            <h1 className="text-2xl font-bold text-white">Staff Dashboard</h1>
            <p className="text-white/40 text-sm mt-0.5">Manage members and track progress</p>
          </div>
          {staffRole.role === 'admin' && (
            <div className="flex flex-wrap justify-end gap-2">
              <Link
                href="/staff/setup"
                className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-colors"
              >
                <SlidersHorizontal size={14} />
                PC Setup
              </Link>
              <Link
                href="/staff/steps"
                className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-colors"
              >
                <Settings size={14} />
                Step Actions
              </Link>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 px-4 -mt-10 pb-8 max-w-5xl mx-auto w-full space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Users size={18} className="text-blue-500" />} label="Members" value={totalMembers} color="blue" />
          <StatCard icon={<BookOpen size={18} className="text-green-500" />} label="Active" value={activeMembers} color="green" />
          <StatCard icon={<CheckCircle2 size={18} className="text-indigo-500" />} label="Path complete" value={completedPath} color="indigo" />
          <StatCard icon={<Flame size={18} className="text-amber-500" />} label="Leadership requests" value={pendingLeadership} color="amber" />
        </div>

        {/* Phase completion breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Discipleship Path Progress</h2>
          <div className="space-y-3">
            {phaseStats.map(({ name, completed, total }) => {
              const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{name}</span>
                    <span className="text-sm text-gray-400">{completed}/{total} <span className="text-xs">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Leadership interest requests */}
        {leadershipRequests.length > 0 && (
          <LeadershipRequests requests={leadershipRequests} />
        )}

        {/* Member list */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">All Members</h2>
          <MemberList members={memberRows} />
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon, label, value, color
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'blue' | 'green' | 'indigo' | 'amber'
}) {
  const bg = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    indigo: 'bg-indigo-50',
    amber: 'bg-amber-50',
  }[color]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
