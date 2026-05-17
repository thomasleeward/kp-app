'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, Droplets, Users, Link2, Link2Off, CalendarPlus, ArrowDownUp, Filter } from 'lucide-react'

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
}

type SortOption = 'name' | 'added_desc' | 'added_asc'
const ALL_TEAMS = '__all__'

export default function MemberList({ members }: { members: MemberRow[] }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [teamFilter, setTeamFilter] = useState(ALL_TEAMS)

  const teams = [...new Set(members.flatMap(m => m.goTeams))]
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

    return matchesText && matchesTeam
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
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          {query ? 'No members match your search.' : 'No members yet.'}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {sorted.map(member => (
            <Link
              key={member.id}
              href={`/staff/members/${member.id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
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
                </div>
              </div>
              <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      )}

      <div className="px-5 py-3 border-t border-gray-50">
        <p className="text-xs text-gray-400">
          {sorted.length} of {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
