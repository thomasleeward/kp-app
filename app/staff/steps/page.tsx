import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StaffHeader from '../components/StaffHeader'
import StepActionEditor from './StepActionEditor'

export default async function StepsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: staffRole } = await supabase
    .from('staff_roles').select('role, user_id').eq('user_id', user.id).single()
  if (staffRole?.role !== 'admin') redirect('/staff')

  const { data: staffProfile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  const [{ data: discSteps }, { data: leadSteps }] = await Promise.all([
    supabase.from('discipleship_steps').select('*').order('phase').order('step_order'),
    supabase.from('leadership_steps').select('*').order('level').order('stage'),
  ])

  const discPhases = (discSteps ?? []).reduce<Record<number, { name: string; steps: any[] }>>(
    (acc, step) => {
      if (!acc[step.phase]) acc[step.phase] = { name: step.phase_name, steps: [] }
      acc[step.phase].steps.push(step)
      return acc
    }, {}
  )

  const leadLevels = (leadSteps ?? []).reduce<Record<number, { name: string; steps: any[] }>>(
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

      <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Step Actions</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Configure the button and popup for each step on the member dashboard.
          </p>
        </div>

        {/* Discipleship steps */}
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Discipleship Path</h2>
          {Object.entries(discPhases).map(([phaseNum, phase]) => (
            <div key={phaseNum} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Phase {phaseNum} — {phase.name}
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {phase.steps.map((step: any) => (
                  <StepActionEditor key={step.id} step={step} type="discipleship" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Leadership steps */}
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Leadership Track</h2>
          {Object.entries(leadLevels).map(([levelNum, level]) => (
            <div key={levelNum} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Level {levelNum} — {level.name}
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {level.steps.map((step: any) => (
                  <StepActionEditor key={step.id} step={step} type="leadership" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
