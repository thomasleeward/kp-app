import { createClient } from '@/lib/supabase/server'

export type CompletionSource = 'self_reported' | 'staff_confirmed' | 'pc_synced'

export interface DiscipleshipStep {
  id: string
  name: string
  phase: number
  phase_name: string
  step_order: number
  prerequisite_step_id: string | null
  flag_if_skipped: boolean
}

export interface LeadershipStep {
  id: string
  level: number
  level_name: string
  stage: string
  name: string
  description: string | null
  is_staff_assigned: boolean
}

export interface ProgressRecord {
  id: string
  user_id: string
  step_id: string
  completed_at: string
  completion_source: CompletionSource
  notes: string | null
}

export interface DiscipleshipStepWithProgress extends DiscipleshipStep {
  completion: ProgressRecord | null
  isLocked: boolean
  showFlag: boolean
}

export interface LeadershipStepWithProgress extends LeadershipStep {
  completion: ProgressRecord | null
  levelLocked: boolean
}

const STAGE_ORDER = ['identification', 'instruction', 'impartation', 'internship']

export async function getDiscipleshipProgress(userId: string): Promise<DiscipleshipStepWithProgress[]> {
  const supabase = await createClient()

  const [{ data: steps }, { data: progress }] = await Promise.all([
    supabase.from('discipleship_steps').select('*').order('phase').order('step_order'),
    supabase.from('member_discipleship_progress').select('*').eq('user_id', userId),
  ])

  if (!steps) return []

  const completedIds = new Set((progress ?? []).map(p => p.step_id))

  return steps.map(step => {
    const completion = (progress ?? []).find(p => p.step_id === step.id) ?? null

    // Hard block: has a prerequisite, NOT flagged (flag_if_skipped=false), prerequisite not done
    const isLocked =
      !!step.prerequisite_step_id &&
      !step.flag_if_skipped &&
      !completedIds.has(step.prerequisite_step_id)

    // Soft flag: has a prerequisite, IS flagged (flag_if_skipped=true),
    // step IS completed, but prerequisite is NOT completed
    const showFlag =
      !!step.prerequisite_step_id &&
      step.flag_if_skipped &&
      !!completion &&
      !completedIds.has(step.prerequisite_step_id)

    return { ...step, completion, isLocked, showFlag }
  })
}

export async function getLeadershipProgress(userId: string): Promise<LeadershipStepWithProgress[]> {
  const supabase = await createClient()

  const [{ data: steps }, { data: progress }] = await Promise.all([
    supabase.from('leadership_steps').select('*'),
    supabase.from('member_leadership_progress').select('*').eq('user_id', userId),
  ])

  if (!steps) return []

  const sorted = [...steps].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level
    return STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage)
  })

  const completedIds = new Set((progress ?? []).map(p => p.step_id))

  return sorted.map(step => {
    const completion = (progress ?? []).find(p => p.step_id === step.id) ?? null

    // Level is locked if any step in the previous level is not yet complete
    const prevLevelSteps = steps.filter(s => s.level === step.level - 1)
    const levelLocked =
      step.level > 1 && !prevLevelSteps.every(s => completedIds.has(s.id))

    return { ...step, completion, levelLocked }
  })
}
