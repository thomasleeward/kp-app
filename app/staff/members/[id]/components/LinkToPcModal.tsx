'use client'

import { useState, useTransition } from 'react'
import { searchPcByName, linkMemberToPC, createAndLinkPcProfile } from '@/app/actions/pc'
import { Search, X, UserPlus, CheckCircle2 } from 'lucide-react'

interface PcPerson { id: string; name: string; email: string | null }

interface Props {
  memberId: string
  memberName: string
  memberEmail: string | null
}

export default function LinkToPcModal({ memberId, memberName, memberEmail }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(memberName)
  const [results, setResults] = useState<PcPerson[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    const matches = await searchPcByName(query)
    setResults(matches)
    setSearching(false)
  }

  function handleSelect(person: PcPerson) {
    startTransition(async () => {
      await linkMemberToPC(memberId, person.id)
      setDone(true)
    })
  }

  function handleCreate() {
    startTransition(async () => {
      await createAndLinkPcProfile(memberId)
      setDone(true)
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors"
      >
        Link to Planning Center
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md flex flex-col max-h-[85vh]">

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-semibold text-gray-900">Link to Planning Center</h2>
                <p className="text-sm text-gray-400 mt-0.5">Search for {memberName}'s PC profile</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            {done ? (
              <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
                <CheckCircle2 size={36} className="text-green-500" />
                <p className="font-medium text-gray-900">Linked successfully</p>
                <p className="text-sm text-gray-400">Progress has been pushed to Planning Center.</p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-2 px-4 py-2 rounded-xl bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="px-6 py-4 border-b border-gray-100 shrink-0">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search by name..."
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searching || !query.trim()}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {searching ? '...' : 'Search'}
                    </button>
                  </form>
                </div>

                {/* Results */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
                  {results === null && (
                    <p className="text-sm text-gray-400 text-center py-4">Search to find their Planning Center profile.</p>
                  )}
                  {results !== null && results.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No matches found.</p>
                  )}
                  {results?.map(person => (
                    <div key={person.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{person.name}</p>
                        {person.email && <p className="text-xs text-gray-400 mt-0.5">{person.email}</p>}
                      </div>
                      <button
                        onClick={() => handleSelect(person)}
                        disabled={pending}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
                      >
                        {pending ? 'Linking...' : 'This is them'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Create new */}
                <div className="px-6 py-4 border-t border-gray-100 shrink-0">
                  <p className="text-xs text-gray-400 mb-3">
                    {results !== null && results.length === 0
                      ? "No match found —"
                      : "Can't find them?"}{' '}
                    Create a new Planning Center profile for {memberName}.
                  </p>
                  <button
                    onClick={handleCreate}
                    disabled={pending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <UserPlus size={15} />
                    {pending ? 'Creating...' : `Create new PC profile for ${memberName}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
