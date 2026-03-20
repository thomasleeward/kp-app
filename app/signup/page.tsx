'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { searchPcByEmail, linkAndImportPcProfile } from '@/app/actions/pc'

type Step = 'email-lookup' | 'pc-confirm' | 'register'

interface PcProfile {
  id: string
  name: string
  email: string | null
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email-lookup')
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
      // Pre-fill the email field and go straight to registration
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

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Step 1: Email lookup */}
        {step === 'email-lookup' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Get started</h1>
            <p className="text-gray-500 mb-8">
              Enter your email and we'll look you up in our system to get you set up quickly.
            </p>

            <form onSubmit={handleEmailSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={lookupEmail}
                  onChange={e => setLookupEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={searching}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Find my profile'}
              </button>
            </form>
          </>
        )}

        {/* Step 2: Pick from matching PC profiles */}
        {step === 'pc-confirm' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Is this you?</h1>
            <p className="text-gray-500 mb-5">
              We found a profile matching that email. Confirm it's you to link your account.
            </p>

            <div className="space-y-2 mb-5">
              {pcMatches.map(match => (
                <button
                  key={match.id}
                  onClick={() => handlePcSelect(match)}
                  className="w-full text-left rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <p className="font-semibold text-gray-900 text-sm">{match.name}</p>
                  {match.email && <p className="text-xs text-gray-400 mt-0.5">{match.email}</p>}
                </button>
              ))}
            </div>

            <button
              onClick={handleNoneMatch}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              None of these are me
            </button>
          </>
        )}

        {/* Step 3: Registration form */}
        {step === 'register' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {pcProfile ? 'Confirm your details' : 'Create your account'}
            </h1>
            <p className="text-gray-500 mb-6">
              {pcProfile
                ? 'Linked to your Planning Center profile. Set a password to finish.'
                : 'Fill in your details to get started.'}
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input
                  type="tel"
                  placeholder="Optional"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">At least 8 characters</p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <button
              onClick={() => setStep('email-lookup')}
              className="mt-4 text-sm text-gray-500 hover:underline"
            >
              ← Back
            </button>
          </>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
