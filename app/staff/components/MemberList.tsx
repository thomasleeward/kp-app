'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ChevronRight } from 'lucide-react'

export interface MemberRow {
  id: string
  full_name: string
  email: string | null
  discCompleted: number
  discTotal: number
  leadershipStatus: 'none' | 'interested' | 'unlocked'
  currentPhase: string
}

export default function MemberList({ members }: { members: MemberRow[] }) {
  const [query, setQuery] = useState('')

  const filtered = members.filter(m => {
    const q = query.toLowerCase()
    return (
      m.full_name.toLowerCase().includes(q) ||
      (m.email ?? '').toLowerCase().includes(q)
    )
  })

  const leadershipBadge = {
    none:       { label: 'Not started',  className: 'bg-gray-100 text-gray-500' },
    interested: { label: 'Interested',   className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
    unlocked:   { label: 'Track open',   className: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' },
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          {query ? 'No members match your search.' : 'No members yet.'}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map(member => (
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
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">{member.currentPhase}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">
                    {member.discCompleted}/{member.discTotal} steps
                  </span>
                </div>
              </div>
              <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      )}

      <div className="px-5 py-3 border-t border-gray-50">
        <p className="text-xs text-gray-400">
          {filtered.length} of {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
