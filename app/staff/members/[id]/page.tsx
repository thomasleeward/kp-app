import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDiscipleshipProgress, getLeadershipProgress } from '@/lib/services/progress'
import StaffHeader from '../../components/StaffHeader'
import MarkCompleteButton from './components/MarkCompleteButton'
import UnmarkButton from './components/UnmarkButton'
import UnlockButton from './components/UnlockButton'
import {
  CheckCircle2, Circle, Lock, AlertTriangle, UserCheck,
  Mail, Phone, User
} from 'lucide-react'

const STAGE_ORDER = ['identification', 'instruction', 'impartation', 'internship']
const stageLabels: Record<string, string> = {
  identification: 'Identification',
  instruction:    'Instruction',
  impartation:    'Impartation',
  internship:     'Internship',
}
const sourceBadge = {
  self_reported:   { label: 'Self-reported', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  staff_confirmed: { label: 'Confirmed',     className: 'bg-green-50 text-green-700 ring-1 ring-green-200' },
  pc_synced:       { label: 'Synced',        className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: memberId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: staffRole } = await supabase
    .from('staff_roles').select('role').eq('user_id', user.id).single()
  if (!staffRole) redirect('/dashboard')

  const { data: staffProfile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  const [
    { data: member },
    discProgress,
    leadProgress,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, phone, leadership_interest_at, leadership_track_unlocked, pc_link_status, created_at')
      .eq('id', memberId)
      .single(),
    getDiscipleshipProgress(memberId),
    getLeadershipProgress(memberId),
  ])

  if (!member) notFound()

  const canEdit = staffRole.role === 'editor' || staffRole.role === 'admin'
  const discCompleted = discProgress.filter(s => s.completion).length

  // Group discipleship steps by phase
  const phases = discProgress.reduce<Record<number, { name: string; steps: typeof discProgress }>>(
    (acc, step) => {
      if (!acc[step.phase]) acc[step.phase] = { name: step.phase_name, steps: [] }
      acc[step.phase].steps.push(step)
      return acc
    }, {}
  )

  // Group leadership steps by level
  const levels = leadProgress.reduce<Record<number, { name: string; steps: typeof leadProgress }>>(
    (acc, step) => {
      if (!acc[step.level]) acc[step.level] = { name: step.level_name, steps: [] }
      acc[step.level].steps.push(step)
      return acc
    }, {}
  )

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      <StaffHeader
        name={staffProfile?.full_name ?? ''}
        role={staffRole.role}
        backHref="/staff"
        backLabel="Dashboard"
      />

      <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full space-y-5">

        {/* Member info card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={18} className="text-gray-400" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">{member.full_name}</h1>
                  <p className="text-xs text-gray-400">
                    Joined {new Date(member.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 ml-1">
                {member.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail size={13} className="text-gray-300" />
                    {member.email}
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone size={13} className="text-gray-300" />
                    {member.phone}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                member.pc_link_status === 'linked'
                  ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                PC {member.pc_link_status}
              </span>
              <span className="text-xs text-gray-400">{discCompleted}/{discProgress.length} steps</span>
            </div>
          </div>
        </div>

        {/* Discipleship Path */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Discipleship Path</h2>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{ width: `${Math.round((discCompleted / discProgress.length) * 100)}%` }}
              />
            </div>
          </div>

          <div className="px-5 py-5 space-y-5">
            {Object.entries(phases).map(([phaseNum, phase]) => (
              <div key={phaseNum}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Phase {phaseNum} — {phase.name}
                </p>
                <div className="space-y-3">
                  {phase.steps.map(step => {
                    const isComplete = !!step.completion
                    return (
                      <div key={step.id} className={`flex items-start gap-3 ${step.isLocked ? 'opacity-40' : ''}`}>
                        <div className="mt-0.5 shrink-0">
                          {step.isLocked ? <Lock size={15} className="text-gray-300" />
                            : isComplete ? <CheckCircle2 size={15} className="text-green-500" />
                            : <Circle size={15} className="text-gray-200" />}
                        </div>
                        <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-sm ${isComplete ? 'text-gray-800' : 'text-gray-500'}`}>
                              {step.name}
                            </span>
                            {isComplete && step.completion && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceBadge[step.completion.completion_source].className}`}>
                                {sourceBadge[step.completion.completion_source].label}
                              </span>
                            )}
                            {step.showFlag && (
                              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                <AlertTriangle size={11} /> Missing Growth Track
                              </span>
                            )}
                          </div>
                          {!isComplete && !step.isLocked && canEdit && (
                            <MarkCompleteButton memberId={member.id} stepId={step.id} type="discipleship" />
                          )}
                          {isComplete && canEdit && (
                            <UnmarkButton memberId={member.id} stepId={step.id} type="discipleship" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leadership Track */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Leadership Track</h2>
              {!member.leadership_track_unlocked && member.leadership_interest_at && (
                <p className="text-xs text-amber-600 mt-0.5">
                  Expressed interest {new Date(member.leadership_interest_at).toLocaleDateString()}
                </p>
              )}
              {!member.leadership_track_unlocked && !member.leadership_interest_at && (
                <p className="text-xs text-gray-400 mt-0.5">Not started</p>
              )}
              {member.leadership_track_unlocked && (
                <p className="text-xs text-indigo-600 mt-0.5">Track unlocked</p>
              )}
            </div>
            {!member.leadership_track_unlocked && canEdit && (
              <UnlockButton memberId={member.id} />
            )}
          </div>

          <div className="px-5 py-5 space-y-6">
            {Object.entries(levels).map(([levelNum, level]) => {
              const isLocked = level.steps[0]?.levelLocked ?? false
              return (
                <div key={levelNum} className={isLocked ? 'opacity-40' : ''}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Level {levelNum} — {level.name}
                    {isLocked && <span className="ml-2 normal-case font-normal">(locked)</span>}
                  </p>
                  <div className="space-y-3">
                    {level.steps
                      .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage))
                      .map(step => {
                        const isComplete = !!step.completion
                        return (
                          <div key={step.id} className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">
                              {isComplete
                                ? <CheckCircle2 size={15} className="text-indigo-500" />
                                : <Circle size={15} className="text-gray-200" />}
                            </div>
                            <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-medium text-gray-300 w-20 shrink-0">
                                  {stageLabels[step.stage]}
                                </span>
                                <span className={`text-sm ${isComplete ? 'text-gray-800' : 'text-gray-500'}`}>
                                  {step.name}
                                </span>
                                {step.is_staff_assigned && !isComplete && (
                                  <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <UserCheck size={11} /> Staff assign
                                  </span>
                                )}
                                {isComplete && step.completion && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceBadge[step.completion.completion_source].className}`}>
                                    {sourceBadge[step.completion.completion_source].label}
                                  </span>
                                )}
                              </div>
                              {!isComplete && !isLocked && canEdit && (
                                <MarkCompleteButton memberId={member.id} stepId={step.id} type="leadership" />
                              )}
                              {isComplete && canEdit && (
                                <UnmarkButton memberId={member.id} stepId={step.id} type="leadership" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
