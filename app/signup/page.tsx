'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Step = 'phone' | 'pc-confirm' | 'register'

interface PcProfile {
  id: string
  name: string
  email: string
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [pcProfile, setPcProfile] = useState<PcProfile | null>(null)
  const [searching, setSearching] = useState(false)

  // Registration form fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Normalize phone: strip everything except digits
  function normalizePhone(raw: string) {
    return raw.replace(/\D/g, '')
  }

  async function handlePhoneSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    setError('')

    // Planning Center lookup will be wired in Phase 5.
    // For now, always proceed to manual registration.
    await new Promise(r => setTimeout(r, 800)) // simulate search delay
    setSearching(false)
    setStep('register')
  }

  function handlePcConfirm() {
    if (pcProfile) {
      setFullName(pcProfile.name)
      setEmail(pcProfile.email)
    }
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
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Step 1: Phone number */}
        {step === 'phone' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Get started</h1>
            <p className="text-gray-500 mb-8">Enter your phone number and we'll look you up in our system.</p>

            <form onSubmit={handlePhoneSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input
                  type="tel"
                  required
                  placeholder="(555) 555-5555"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
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

        {/* Step 2: Confirm PC profile match */}
        {step === 'pc-confirm' && pcProfile && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Is this you?</h1>
            <p className="text-gray-500 mb-6">We found a profile that matches your phone number.</p>

            <div className="rounded-lg border border-gray-200 bg-white p-4 mb-6">
              <p className="font-semibold text-gray-900">{pcProfile.name}</p>
              <p className="text-sm text-gray-500">{pcProfile.email}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePcConfirm}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Yes, that's me
              </button>
              <button
                onClick={() => { setPcProfile(null); setStep('register') }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                That's not me
              </button>
            </div>
          </>
        )}

        {/* Step 3: Registration form */}
        {step === 'register' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-500 mb-8">Fill in your details to get started.</p>

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
              onClick={() => setStep('phone')}
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
