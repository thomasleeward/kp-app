'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  name: string
  role: string
  backHref?: string
  backLabel?: string
}

export default function StaffHeader({ name, role, backHref, backLabel }: Props) {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-900 to-blue-950 border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="flex items-center gap-1 text-sm text-white/50 hover:text-white/90 transition-colors"
            >
              <ChevronLeft size={16} />
              <span>{backLabel ?? 'Back'}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <span className="text-white text-xs font-bold tracking-tight">KP</span>
              </div>
              <span className="font-semibold text-white/90 text-sm">Staff</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-white/50">{name}</span>
            <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full capitalize border border-white/10">{role}</span>
          </div>
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
