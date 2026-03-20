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

// ─── Custom field IDs ─────────────────────────────────────────────────────────

const DISC_FIELD_ID = '1033964'
const LEAD_FIELD_ID = '1034012'

// Map: PC option ID → DB step name (matches discipleship_steps.name)
const DISC_OPTION_TO_NAME: Record<string, string> = {
  '10623307': 'Attend Sunday Service',
  '10623308': 'Complete One-2-One',
  '10623309': 'Biblical Foundations Class',
  '10623310': 'Growth Track',
  '10623311': 'Join the Go Team',
  '10623312': 'Discipleship Journey Class',
  '10623313': 'Join a Life Group',
}

// Map: PC option ID → constructed name matching "${level_name}: ${name}" in DB
const LEAD_OPTION_TO_NAME: Record<string, string> = {
  '10623671': 'Member: Join the Go Team',
  '10623672': 'Member: Discipleship Classes',
  '10623673': 'Member: Community & One-on-One with a Leader',
  '10623674': 'Member: Shift Leader or Apprentice Role',
  '10623675': 'Leader: F.A.I.T.H. & Leading Others',
  '10623676': 'Leader: Discipleship Classes',
  '10623677': 'Leader: Leaders Community & One-on-One with Coach',
  '10623678': 'Leader: Assisting as a Coach',
  '10623679': 'Coach: Leader of Leaders',
  '10623680': 'Coach: EQUIP',
  '10623681': 'Coach: Coaches Community & One-on-One with Ministry Leader',
  '10623682': 'Coach: Assisting as a Ministry Leader',
  '10623683': 'Ministry Leader: Organizational Leader Role',
  '10623684': 'Ministry Leader: Leadership 215',
  '10623685': 'Ministry Leader: One-on-One with Staff or Pastor',
  '10623686': 'Ministry Leader: Staff Invitation or Role Continuation',
}

// Reverse maps: lowercase DB name → option ID
const DISC_NAME_TO_OPTION = Object.fromEntries(
  Object.entries(DISC_OPTION_TO_NAME).map(([id, name]) => [name.toLowerCase(), id])
)
const LEAD_NAME_TO_OPTION = Object.fromEntries(
  Object.entries(LEAD_OPTION_TO_NAME).map(([id, name]) => [name.toLowerCase(), id])
)

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
// PC checkboxes: one FieldDatum record per checked option, linked via relationship

async function getCheckedFieldData(
  personId: string,
  fieldDefinitionId: string
): Promise<Array<{ datumId: string; optionId: string }>> {
  try {
    const data = await pcGet(`/people/${personId}/field_data`)
    return (data.data ?? [])
      .filter(
        (fd: any) =>
          fd.relationships?.field_definition?.data?.id === fieldDefinitionId &&
          fd.relationships?.field_option?.data?.id
      )
      .map((fd: any) => ({
        datumId: fd.id,
        optionId: fd.relationships.field_option.data.id as string,
      }))
  } catch {
    return []
  }
}

async function checkOption(personId: string, fieldDefinitionId: string, optionId: string) {
  await pcPost(`/people/${personId}/field_data`, {
    data: {
      type: 'FieldDatum',
      relationships: {
        field_definition: { data: { type: 'FieldDefinition', id: fieldDefinitionId } },
        field_option: { data: { type: 'FieldOption', id: optionId } },
      },
    },
  })
}

// ─── Import: get completed step names for a person ───────────────────────────

export async function importPersonProgress(pcPersonId: string): Promise<{
  completedDiscipleship: string[]
  completedLeadership: string[]
}> {
  try {
    const [discData, leadData] = await Promise.all([
      getCheckedFieldData(pcPersonId, DISC_FIELD_ID),
      getCheckedFieldData(pcPersonId, LEAD_FIELD_ID),
    ])

    return {
      completedDiscipleship: discData
        .filter(d => DISC_OPTION_TO_NAME[d.optionId])
        .map(d => DISC_OPTION_TO_NAME[d.optionId]),
      completedLeadership: leadData
        .filter(d => LEAD_OPTION_TO_NAME[d.optionId])
        .map(d => LEAD_OPTION_TO_NAME[d.optionId]),
    }
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
  const nameToOption = workflowType === 'discipleship' ? DISC_NAME_TO_OPTION : LEAD_NAME_TO_OPTION

  const optionId = nameToOption[stepName.trim().toLowerCase()]
  if (!optionId) return

  const checked = await getCheckedFieldData(pcPersonId, fieldId)
  if (checked.some(d => d.optionId === optionId)) return // already checked

  await checkOption(pcPersonId, fieldId, optionId)
}

export async function unsyncStepFromPC(
  pcPersonId: string,
  stepName: string,
  workflowType: 'discipleship' | 'leadership'
) {
  const fieldId = workflowType === 'discipleship' ? DISC_FIELD_ID : LEAD_FIELD_ID
  const nameToOption = workflowType === 'discipleship' ? DISC_NAME_TO_OPTION : LEAD_NAME_TO_OPTION

  const optionId = nameToOption[stepName.trim().toLowerCase()]
  if (!optionId) return

  const checked = await getCheckedFieldData(pcPersonId, fieldId)
  const datum = checked.find(d => d.optionId === optionId)
  if (!datum) return

  await pcDelete(`/people/${pcPersonId}/field_data/${datum.datumId}`)
}
