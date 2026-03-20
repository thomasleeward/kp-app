const BASE_URL = 'https://api.planningcenteronline.com/people/v2'

function getHeaders() {
  const credentials = Buffer.from(
    `${process.env.PLANNING_CENTER_APP_ID}:${process.env.PLANNING_CENTER_SECRET}`
  ).toString('base64')
  return {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
  }
}

async function pcGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`PC API error ${res.status}: ${path}`)
  return res.json()
}

async function pcPost(path: string, body: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PC API error ${res.status}: POST ${path}`)
  return res.json()
}

async function pcDelete(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`PC API error ${res.status}: DELETE ${path}`)
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PcPerson {
  id: string
  name: string
  email: string | null
}

// ─── Option mappings ──────────────────────────────────────────────────────────
// pcLabel: exact text stored as value in PC FieldDatum (must match PC option label)
// dbName:  matches discipleship_steps.name or "${level_name}: ${name}" in DB

interface OptionMap {
  pcLabel: string
  dbName: string
}

const DISC_FIELD_ID = '1033964'
const LEAD_FIELD_ID = '1034012'

const DISC_OPTIONS: Record<string, OptionMap> = {
  '10623307': { pcLabel: 'Attended Sunday Service',    dbName: 'Attend Sunday Service' },
  '10623308': { pcLabel: 'Completed One-2-One',        dbName: 'Complete One-2-One' },
  '10623309': { pcLabel: 'Biblical Foundations Class', dbName: 'Biblical Foundations Class' },
  '10623310': { pcLabel: 'Growth Track',               dbName: 'Growth Track' },
  '10623311': { pcLabel: 'Join the Go Team',           dbName: 'Join the Go Team' },
  '10623312': { pcLabel: 'Discipleship Journey Class', dbName: 'Discipleship Journey Class' },
  '10623313': { pcLabel: 'Join a Life Group',          dbName: 'Join a Life Group' },
}

const LEAD_OPTIONS: Record<string, OptionMap> = {
  '10623671': { pcLabel: 'Member: Join the Go Team',                                  dbName: 'Member: Join the Go Team' },
  '10623672': { pcLabel: 'Member: Discipleship Classes',                              dbName: 'Member: Discipleship Classes' },
  '10623673': { pcLabel: 'Member: Community & One-on-One with Leader',                dbName: 'Member: Community & One-on-One with a Leader' },
  '10623674': { pcLabel: 'Member: Shift Leader or Apprentice Role',                   dbName: 'Member: Shift Leader or Apprentice Role' },
  '10623675': { pcLabel: 'Leader: F.A.I.T.H. & Leading Others',                      dbName: 'Leader: F.A.I.T.H. & Leading Others' },
  '10623676': { pcLabel: 'Leader: Discipleship Classes',                              dbName: 'Leader: Discipleship Classes' },
  '10623677': { pcLabel: 'Leader: Leaders Community & One-on-One with Coach',         dbName: 'Leader: Leaders Community & One-on-One with Coach' },
  '10623678': { pcLabel: 'Leader: Assisting as a Coach',                              dbName: 'Leader: Assisting as a Coach' },
  '10623679': { pcLabel: 'Coach: Leader of Leaders',                                  dbName: 'Coach: Leader of Leaders' },
  '10623680': { pcLabel: 'Coach: EQUIP',                                              dbName: 'Coach: EQUIP' },
  '10623681': { pcLabel: 'Coach: Coaches Community & One-on-One with Ministry Leader', dbName: 'Coach: Coaches Community & One-on-One with Ministry Leader' },
  '10623682': { pcLabel: 'Coach: Assisting as a Ministry Leader',                     dbName: 'Coach: Assisting as a Ministry Leader' },
  '10623683': { pcLabel: 'Ministry Leader: Organizational Leader Role',               dbName: 'Ministry Leader: Organizational Leader Role' },
  '10623684': { pcLabel: 'Ministry Leader: Leadership 215',                           dbName: 'Ministry Leader: Leadership 215' },
  '10623685': { pcLabel: 'Ministry Leader: One-on-One with Staff or Pastor',          dbName: 'Ministry Leader: One-on-One with Staff or Pastor' },
  '10623686': { pcLabel: 'Ministry Leader: Staff Invitation or Role Continuation',    dbName: 'Ministry Leader: Staff Invitation or Role Continuation' },
}

function findOptionByDbName(options: Record<string, OptionMap>, dbName: string) {
  const lower = dbName.trim().toLowerCase()
  return Object.entries(options).find(([, m]) => m.dbName.toLowerCase() === lower) ?? null
}

function findOptionByPcLabel(options: Record<string, OptionMap>, pcLabel: string) {
  const lower = pcLabel.trim().toLowerCase()
  return Object.entries(options).find(([, m]) => m.pcLabel.toLowerCase() === lower) ?? null
}

// ─── People search ────────────────────────────────────────────────────────────

export async function searchPeopleByEmail(email: string): Promise<PcPerson[]> {
  try {
    const encoded = encodeURIComponent(email.trim().toLowerCase())
    const data = await pcGet(
      `/people?where[search_name_or_email]=${encoded}&include=emails&per_page=10`
    )
    if (!data.data?.length) return []

    const included = data.included ?? []

    return data.data.map((person: any) => {
      const emailIds: string[] = (person.relationships?.emails?.data ?? []).map((e: any) => e.id)
      const emailItems = included.filter(
        (i: any) => i.type === 'Email' && emailIds.includes(i.id)
      )
      const primaryEmail =
        emailItems.find((e: any) => e.attributes.primary)?.attributes?.address ??
        emailItems[0]?.attributes?.address ??
        null
      return { id: person.id, name: person.attributes.name, email: primaryEmail }
    })
  } catch (e) {
    console.error('[PC] Search error:', e)
    return []
  }
}

// ─── Field data helpers ───────────────────────────────────────────────────────
// PC checkboxes: one FieldDatum per checked option, value = exact PC option label text

async function getFieldData(
  personId: string,
  fieldDefinitionId: string
): Promise<Array<{ datumId: string; value: string }>> {
  try {
    const data = await pcGet(`/people/${personId}/field_data`)
    return (data.data ?? [])
      .filter(
        (fd: any) => fd.relationships?.field_definition?.data?.id === fieldDefinitionId
      )
      .map((fd: any) => ({ datumId: fd.id, value: fd.attributes?.value ?? '' }))
  } catch {
    return []
  }
}

// ─── Import: get completed step names for a person ───────────────────────────

export async function importPersonProgress(pcPersonId: string): Promise<{
  completedDiscipleship: string[]
  completedLeadership: string[]
}> {
  try {
    const [discData, leadData] = await Promise.all([
      getFieldData(pcPersonId, DISC_FIELD_ID),
      getFieldData(pcPersonId, LEAD_FIELD_ID),
    ])

    const completedDiscipleship = discData
      .map(d => findOptionByPcLabel(DISC_OPTIONS, d.value))
      .filter(Boolean)
      .map(entry => entry![1].dbName)

    const completedLeadership = leadData
      .map(d => findOptionByPcLabel(LEAD_OPTIONS, d.value))
      .filter(Boolean)
      .map(entry => entry![1].dbName)

    return { completedDiscipleship, completedLeadership }
  } catch (e) {
    console.error('[PC] Import error:', e)
    return { completedDiscipleship: [], completedLeadership: [] }
  }
}

// ─── Write-back: check / uncheck a step in the PC custom field ────────────────

export async function syncStepCompletionToPC(
  pcPersonId: string,
  stepName: string,
  workflowType: 'discipleship' | 'leadership'
) {
  const fieldId = workflowType === 'discipleship' ? DISC_FIELD_ID : LEAD_FIELD_ID
  const options = workflowType === 'discipleship' ? DISC_OPTIONS : LEAD_OPTIONS

  const entry = findOptionByDbName(options, stepName)
  if (!entry) {
    console.error(`[PC] No option found for step: "${stepName}"`)
    return
  }
  const pcLabel = entry[1].pcLabel

  const existing = await getFieldData(pcPersonId, fieldId)
  if (existing.some(d => d.value.toLowerCase() === pcLabel.toLowerCase())) return // already checked

  await pcPost(`/people/${pcPersonId}/field_data`, {
    data: {
      type: 'FieldDatum',
      attributes: { value: pcLabel },
      relationships: {
        field_definition: { data: { type: 'FieldDefinition', id: fieldId } },
      },
    },
  })
}

export async function unsyncStepFromPC(
  pcPersonId: string,
  stepName: string,
  workflowType: 'discipleship' | 'leadership'
) {
  const fieldId = workflowType === 'discipleship' ? DISC_FIELD_ID : LEAD_FIELD_ID
  const options = workflowType === 'discipleship' ? DISC_OPTIONS : LEAD_OPTIONS

  const entry = findOptionByDbName(options, stepName)
  if (!entry) return
  const pcLabel = entry[1].pcLabel

  const existing = await getFieldData(pcPersonId, fieldId)
  const datum = existing.find(d => d.value.toLowerCase() === pcLabel.toLowerCase())
  if (!datum) return

  await pcDelete(`/people/${pcPersonId}/field_data/${datum.datumId}`)
}
