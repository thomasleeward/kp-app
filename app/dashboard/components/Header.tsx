'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function Header({ name }: { name: string }) {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">KP</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Discipleship</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{name}</span>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
