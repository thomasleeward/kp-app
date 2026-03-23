import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: staffRole } = await supabase
      .from('staff_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    redirect(staffRole ? '/staff' : '/dashboard')
  }

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">
      {/* Background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-800/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex-1 flex flex-col items-center justify-between px-6 py-16 max-w-sm mx-auto w-full">

        {/* Top mark */}
        <div className="flex items-center gap-2 self-start">
          <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-bold text-sm">KP</span>
          </div>
          <span className="text-white/60 text-sm font-medium">King's Park</span>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center text-center py-12">
          <div className="mb-6">
            <span className="inline-block text-xs font-semibold tracking-widest text-blue-300 uppercase mb-4">
              Discipleship Path
            </span>
            <h1 className="text-5xl font-bold text-white leading-tight tracking-tight mb-5">
              Take Your<br />Next Step
            </h1>
            <p className="text-blue-200/80 text-base leading-relaxed max-w-xs mx-auto">
              King's Park is committed to helping every person grow in their faith, find community, and step into their calling.
            </p>
          </div>

          {/* Dots decoration */}
          <div className="flex justify-center gap-2 mb-10">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: i === 0 ? '#60a5fa' : 'rgba(255,255,255,0.2)' }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-3">
          <Link
            href="/signup"
            className="block w-full text-center bg-white text-slate-900 font-semibold py-4 rounded-2xl text-base hover:bg-blue-50 transition-colors shadow-lg shadow-black/20"
          >
            Take Your Next Step
          </Link>
          <Link
            href="/login"
            className="block w-full text-center bg-white/10 backdrop-blur-sm text-white font-medium py-4 rounded-2xl text-base hover:bg-white/20 transition-colors border border-white/10"
          >
            Login to Existing Account
          </Link>
        </div>

      </div>
    </div>
  )
}
