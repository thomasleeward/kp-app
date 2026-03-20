import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getPcFieldDefinitions() {
  const credentials = Buffer.from(
    `${process.env.PLANNING_CENTER_APP_ID}:${process.env.PLANNING_CENTER_SECRET}`
  ).toString('base64')

  const res = await fetch(
    'https://api.planningcenteronline.com/people/v2/field_definitions?per_page=100&include=field_options',
    { headers: { Authorization: `Basic ${credentials}` }, cache: 'no-store' }
  )
  return res.json()
}

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: staffRole } = await supabase
    .from('staff_roles').select('role').eq('user_id', user.id).single()
  if (staffRole?.role !== 'admin') redirect('/staff')

  const data = await getPcFieldDefinitions()
  const fields = data.data ?? []
  const included = data.included ?? []

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-2">PC Field Definitions</h1>
      <p className="text-sm text-gray-500 mb-6">
        Find your Discipleship Path and Leadership Track fields below and note the Field ID and Option IDs.
      </p>

      <div className="space-y-6">
        {fields.map((field: any) => {
          const optionIds = (field.relationships?.field_options?.data ?? []).map((o: any) => o.id)
          const options = included.filter((i: any) => i.type === 'FieldOption' && optionIds.includes(i.id))

          return (
            <div key={field.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{field.attributes.name}</p>
                  <p className="text-xs text-gray-400">{field.attributes.data_type} · Tab: {field.attributes.tab_id ?? 'none'}</p>
                </div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{field.id}</code>
              </div>

              {options.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {options.map((opt: any) => (
                    <div key={opt.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{opt.attributes.value}</span>
                      <code className="text-xs bg-gray-50 px-2 py-0.5 rounded font-mono text-gray-500">{opt.id}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
