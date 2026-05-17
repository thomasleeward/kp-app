'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteMemberProfile } from '@/app/actions/staff'
import { Search, ChevronRight, Droplets, Users, Link2, Link2Off, CalendarPlus, ArrowDownUp, Filter, Trash2 } from 'lucide-react'

export interface MemberRow {
  id: string
  full_name: string
  email: string | null
  created_at: string | null
  discCompleted: number
  discTotal: number
  leadershipStatus: 'none' | 'interested' | 'unlocked'
  currentPhase: string
  inLifeGroup: boolean
  baptized: boolean
  pcLinked: boolean
  goTeams: string[]
  tags: string[]
}

type SortOption = 'name' | 'added_desc' | 'added_asc'
const ALL_TEAMS = '__all__'
const ALL_TAGS = '__all__'

export default function MemberList({ members, canRemove = false }: { members: MemberRow[]; canRemove?: boolean }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [teamFilter, setTeamFilter] = useState(ALL_TEAMS)
  const [tagFilter, setTagFilter] = useState(ALL_TAGS)
  const [memberToRemove, setMemberToRemove] = useState<MemberRow | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const router = useRouter()

  const teams = [...new Set(members.flatMap(m => m.goTeams))]
    .sort((a, b) => a.localeCompare(b))
  const tags = [...new Set(members.flatMap(m => m.tags))]
    .sort((a, b) => a.localeCompare(b))

  const dateValue = (date: string | null) => {
    if (!date) return 0

    const parsed = new Date(date).getTime()
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const filtered = members.filter(m => {
    const q = query.toLowerCase()
    const matchesText = (
      m.full_name.toLowerCase().includes(q) ||
      (m.email ?? '').toLowerCase().includes(q)
    )

    const matchesTeam = teamFilter === ALL_TEAMS || m.goTeams.includes(teamFilter)
    const matchesTag = tagFilter === ALL_TAGS || m.tags.includes(tagFilter)

    return matchesText && matchesTeam && matchesTag
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'added_desc') return dateValue(b.created_at) - dateValue(a.created_at)
    if (sortBy === 'added_asc') return dateValue(a.created_at) - dateValue(b.created_at)

    return a.full_name.localeCompare(b.full_name)
  })

  const leadershipBadge = {
    none:       { label: 'Not started',  className: 'bg-gray-100 text-gray-500' },
    interested: { label: 'Interested',   className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
    unlocked:   { label: 'Track open',   className: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' },
  }

  const formatAddedDate = (date: string | null) => {
    if (!date) return 'Date unavailable'

    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return 'Date unavailable'

    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  async function handleRemove() {
    if (!memberToRemove) return

    setRemoving(true)
    setRemoveError(null)

    try {
      await deleteMemberProfile(memberToRemove.id)
      setMemberToRemove(null)
      router.refresh()
    } catch (e) {
      setRemoveError(e instanceof Error ? e.message : 'Unable to remove member.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative sm:w-44">
            <ArrowDownUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              aria-label="Sort members"
              className="w-full appearance-none pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600"
            >
              <option value="name">Name</option>
              <option value="added_desc">Newest added</option>
              <option value="added_asc">Oldest added</option>
            </select>
            <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-300 pointer-events-none" />
          </div>
          {teams.length > 0 && (
            <div className="relative sm:w-52">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <select
                value={teamFilter}
                onChange={e => setTeamFilter(e.target.value)}
                aria-label="Filter by Go Team"
                className="w-full appearance-none pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600"
              >
                <option value={ALL_TEAMS}>All Go Teams</option>
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-300 pointer-events-none" />
            </div>
          )}
          {tags.length > 0 && (
            <div className="relative sm:w-44">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <select
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
                aria-label="Filter by tag"
                className="w-full appearance-none pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600"
              >
                <option value={ALL_TAGS}>All Tags</option>
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-300 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          {query ? 'No members match your search.' : 'No members yet.'}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {sorted.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
            >
              <Link href={`/staff/members/${member.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{member.full_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${leadershipBadge[member.leadershipStatus].className}`}>
                    {leadershipBadge[member.leadershipStatus].label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400">{member.currentPhase}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">
                    {member.discCompleted}/{member.discTotal} steps
                  </span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <CalendarPlus size={11} />
                    Added {formatAddedDate(member.created_at)}
                  </span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className={`flex items-center gap-1 text-xs ${member.inLifeGroup ? 'text-green-600' : 'text-gray-300'}`}>
                    <Users size={11} />
                    Life Group
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${member.baptized ? 'text-blue-500' : 'text-gray-300'}`}>
                    <Droplets size={11} />
                    Baptized
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${member.pcLinked ? 'text-green-600' : 'text-amber-500'}`}>
                    {member.pcLinked ? <Link2 size={11} /> : <Link2Off size={11} />}
                    PC
                  </span>
                  {member.goTeams.slice(0, 3).map(team => (
                    <span key={team} className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {team}
                    </span>
                  ))}
                  {member.goTeams.length > 3 && (
                    <span className="text-xs text-gray-400">+{member.goTeams.length - 3}</span>
                  )}
                  {member.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                  {member.tags.length > 3 && (
                    <span className="text-xs text-gray-400">+{member.tags.length - 3}</span>
                  )}
                </div>
              </Link>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => {
                    setMemberToRemove(member)
                    setRemoveError(null)
                  }}
                  aria-label={`Remove ${member.full_name}`}
                  className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
            </div>
          ))}
        </div>
      )}

      <div className="px-5 py-3 border-t border-gray-50">
        <p className="text-xs text-gray-400">
          {sorted.length} of {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
      </div>

      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-sm">
            <h2 className="font-semibold text-gray-900 mb-1">Remove member?</h2>
            <p className="text-sm text-gray-500 mb-5">
              This will permanently delete <span className="font-medium text-gray-700">{memberToRemove.full_name}</span>&apos;s
              account and all their progress data. This cannot be undone.
            </p>
            {removeError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">
                {removeError}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={removing}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-xl disabled:opacity-50 transition-colors"
              >
                {removing ? 'Removing...' : 'Yes, remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
