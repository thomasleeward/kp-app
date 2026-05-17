'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addMemberTag, removeMemberTag } from '@/app/actions/pc'
import { Plus, Tag, X } from 'lucide-react'

export default function TagEditor({
  memberId,
  tags,
  tagOptions,
}: {
  memberId: string
  tags: string[]
  tagOptions: string[]
}) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [selectedTag, setSelectedTag] = useState('')
  const [newTag, setNewTag] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const availableTags = tagOptions.filter(
    option => !tags.some(tag => tag.toLowerCase() === option.toLowerCase())
  )
  const tag = mode === 'new' ? newTag : selectedTag

  function handleAdd() {
    const nextTag = tag.trim().replace(/\s+/g, ' ')
    if (!nextTag) return

    setError(null)
    startTransition(async () => {
      try {
        await addMemberTag(memberId, nextTag)
        setSelectedTag('')
        setNewTag('')
        setMode('existing')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to add tag.')
      }
    })
  }

  function handleRemove(value: string) {
    setError(null)
    startTransition(async () => {
      try {
        await removeMemberTag(memberId, value)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to remove tag.')
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Tag size={15} className="text-indigo-500" />
        </div>
        <h2 className="font-semibold text-gray-900">Tags</h2>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map(value => (
            <button
              key={value}
              type="button"
              onClick={() => handleRemove(value)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 px-2.5 py-1 rounded-full hover:bg-indigo-100 disabled:opacity-50 transition-colors"
            >
              {value}
              <X size={12} />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        {mode === 'existing' ? (
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <select
              value={selectedTag}
              onChange={e => setSelectedTag(e.target.value)}
              disabled={pending || availableTags.length === 0}
              aria-label="Select tag"
              className="flex-1 px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="">{availableTags.length > 0 ? 'Choose a tag...' : 'No more tags available'}</option>
              {availableTags.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setMode('new')
                setSelectedTag('')
                setError(null)
              }}
              disabled={pending}
              className="px-3 py-2 text-sm font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-50 ring-1 ring-indigo-100 rounded-xl disabled:opacity-50 transition-colors"
            >
              New Tag
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAdd()
                }
              }}
              placeholder="Create a new tag..."
              disabled={pending}
              className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => {
                setMode('existing')
                setNewTag('')
                setError(null)
              }}
              disabled={pending}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-50 ring-1 ring-gray-200 rounded-xl disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending || !tag.trim()}
          className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Plus size={14} />
          Add Tag
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mt-3">
          {error}
        </p>
      )}
    </div>
  )
}
