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
    router.push('/login')
  }

  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link href={backHref} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors mr-1">
              <ChevronLeft size={16} />
              <span>{backLabel ?? 'Back'}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">KP</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm">Staff Dashboard</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-gray-500">{name}</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{role}</span>
          </div>
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
