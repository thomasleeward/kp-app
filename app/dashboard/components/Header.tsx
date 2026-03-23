'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function Header({ name }: { name: string }) {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-900 to-blue-950 border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <span className="text-white text-xs font-bold tracking-tight">KP</span>
          </div>
          <span className="font-semibold text-white/90 text-sm">Discipleship</span>
        </div>
        <div className="flex items-center gap-3">
          {name && (
            <span className="text-sm text-white/50 hidden sm:block">{name}</span>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
          >
            <LogOut size={13} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
