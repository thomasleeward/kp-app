import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StaffHeader from './components/StaffHeader'
import MemberList, { MemberRow } from './components/MemberList'
import LeadershipRequests, { LeadershipRequest } from './components/LeadershipRequests'
import { Users, CheckCircle2, BookOpen, Flame } from 'lucide-react'

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
      .select('id, full_name, email, leadership_interest_at, leadership_track_unlocked')
      .order('full_name'),
    supabase
      .from('discipleship_steps')
      .select('id, phase, phase_name, step_order')
      .order('phase')
      .order('step_order'),
    supabase
      .from('member_discipleship_progress')
      .select('user_id, step_id'),
  ])

  const allProfiles = profiles ?? []
  const allSteps = discSteps ?? []
  const allProgress = discProgress ?? []

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
      discCompleted: completed.length,
      discTotal: allSteps.length,
      currentPhase,
      leadershipStatus: profile.leadership_track_unlocked
        ? 'unlocked'
        : profile.leadership_interest_at
          ? 'interested'
          : 'none',
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

      <main className="flex-1 px-4 py-8 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage members and track progress</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Users size={18} className="text-blue-500" />} label="Members" value={totalMembers} color="blue" />
          <StatCard icon={<BookOpen size={18} className="text-green-500" />} label="Active" value={activeMembers} color="green" />
          <StatCard icon={<CheckCircle2 size={18} className="text-indigo-500" />} label="Path complete" value={completedPath} color="indigo" />
          <StatCard icon={<Flame size={18} className="text-amber-500" />} label="Leadership requests" value={pendingLeadership} color="amber" />
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
