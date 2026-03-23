'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { searchPcByEmail, linkAndImportPcProfile } from '@/app/actions/pc'
import { ArrowLeft, Sparkles, Clock } from 'lucide-react'

type Step = 'new-check' | 'email-lookup' | 'pc-confirm' | 'register'

interface PcProfile {
  id: string
  name: string
  email: string | null
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('new-check')
  const [isNewToChurch, setIsNewToChurch] = useState<boolean | null>(null)
  const [lookupEmail, setLookupEmail] = useState('')
  const [pcMatches, setPcMatches] = useState<PcProfile[]>([])
  const [pcProfile, setPcProfile] = useState<PcProfile | null>(null)
  const [searching, setSearching] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function normalizePhone(raw: string) {
    return raw.replace(/\D/g, '')
  }

  function handleNewCheck(isNew: boolean) {
    setIsNewToChurch(isNew)
    setStep('email-lookup')
  }

  async function handleEmailSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    setError('')

    const matches = await searchPcByEmail(lookupEmail)
    setSearching(false)

    if (matches.length > 0) {
      setPcMatches(matches)
      setStep('pc-confirm')
    } else {
      setEmail(lookupEmail)
      setStep('register')
    }
  }

  function handlePcSelect(profile: PcProfile) {
    setPcProfile(profile)
    setFullName(profile.name)
    if (profile.email) setEmail(profile.email)
    setStep('register')
  }

  function handleNoneMatch() {
    setPcProfile(null)
    setEmail(lookupEmail)
    setStep('register')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (signUpData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          full_name: fullName,
          email,
          phone: normalizePhone(phone),
          is_new_to_church: isNewToChurch === true,
        })

      if (profileError) {
        setError('Account created but profile setup failed: ' + profileError.message)
        setLoading(false)
        return
      }

      if (pcProfile) {
        await linkAndImportPcProfile(signUpData.user.id, pcProfile.id)
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  const stepBack: Record<Step, Step | 'landing'> = {
    'new-check': 'landing',
    'email-lookup': 'new-check',
    'pc-confirm': 'email-lookup',
    'register': 'email-lookup',
  }

  function handleBack() {
    const prev = stepBack[step]
    if (prev === 'landing') {
      router.push('/')
    } else {
      setStep(prev)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">
      <div className="relative flex-1 flex flex-col px-6 py-12 max-w-sm mx-auto w-full">

        {/* Back */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors text-sm mb-12 self-start"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        {/* Step 0: New to church? */}
        {step === 'new-check' && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Hey there!</h1>
              <p className="text-blue-200/70">Is this your first time at King's Park?</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleNewCheck(true)}
                className="w-full text-left bg-white/10 border border-white/20 rounded-2xl p-5 hover:bg-white/20 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center shrink-0">
                    <Sparkles size={18} className="text-blue-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">I'm brand new</p>
                    <p className="text-blue-200/60 text-xs mt-0.5">First time here — excited to get started</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleNewCheck(false)}
                className="w-full text-left bg-white/10 border border-white/20 rounded-2xl p-5 hover:bg-white/20 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-indigo-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">I've been attending</p>
                    <p className="text-blue-200/60 text-xs mt-0.5">I'm part of the community already</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Email lookup */}
        {step === 'email-lookup' && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {isNewToChurch ? 'Welcome!' : 'Good to see you'}
              </h1>
              <p className="text-blue-200/70">
                Enter your email and we'll check if we already have you in our system.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
              <form onSubmit={handleEmailSearch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Email address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={lookupEmail}
                    onChange={e => setLookupEmail(e.target.value)}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-300 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={searching}
                  className="w-full bg-white text-slate-900 font-semibold py-3.5 rounded-xl text-sm hover:bg-blue-50 disabled:opacity-50 transition-colors"
                >
                  {searching ? 'Searching...' : 'Continue'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Step 2: Pick from matching PC profiles */}
        {step === 'pc-confirm' && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Is this you?</h1>
              <p className="text-blue-200/70">
                We found a profile matching that email. Confirm it's you to link your account.
              </p>
            </div>

            <div className="space-y-2 mb-4">
              {pcMatches.map(match => (
                <button
                  key={match.id}
                  onClick={() => handlePcSelect(match)}
                  className="w-full text-left bg-white/10 border border-white/20 rounded-2xl px-5 py-4 hover:bg-white/20 hover:border-blue-400/50 transition-colors"
                >
                  <p className="font-semibold text-white text-sm">{match.name}</p>
                  {match.email && <p className="text-xs text-blue-200/60 mt-0.5">{match.email}</p>}
                </button>
              ))}
            </div>

            <button
              onClick={handleNoneMatch}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3.5 text-sm font-medium text-white/60 hover:bg-white/20 transition-colors"
            >
              None of these are me
            </button>
          </div>
        )}

        {/* Step 3: Registration form */}
        {step === 'register' && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                {pcProfile ? 'Confirm your details' : 'Create your account'}
              </h1>
              <p className="text-blue-200/70">
                {pcProfile
                  ? "Linked to your Planning Center profile. Set a password to finish."
                  : "Almost there — fill in a few details to get started."}
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-400/20 rounded-2xl px-4 py-3 mb-5 text-sm text-blue-200">
              {pcProfile
                ? "If we already have your progress on file, you'll see it on your dashboard. If anything looks incomplete, you'll be able to update it."
                : "Once you're in, you'll be able to let us know which steps you've already completed."}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Full name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">
                    Phone <span className="text-white/30 font-normal">— optional</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-300 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-slate-900 font-semibold py-3.5 rounded-xl text-sm hover:bg-blue-50 disabled:opacity-50 transition-colors mt-2"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-white/30">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-300 hover:text-blue-200 font-medium">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}
