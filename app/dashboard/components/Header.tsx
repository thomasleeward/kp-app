'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'
import Image from 'next/image'

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
          <Image src="/kp-app-icon-white.png" alt="Discipleship Path" width={32} height={32} className="rounded-xl" />
          <span className="font-semibold text-white/90 text-sm">Discipleship Path</span>
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
